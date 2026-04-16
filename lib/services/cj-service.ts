/**
 * CJ DROPSHIPPING API SERVICE v2
 * Priority flow: Sales Volume → Supplier Score → Margin
 * Supports: best-seller discovery, full variant fetch, background price sync
 */

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

// Our store's focus niches — Llama will automatically search these
export const STORE_NICHES = [
  { keyword: 'back pain relief',      niche: 'back-pain',  category: 'Health & Beauty'   },
  { keyword: 'posture corrector',     niche: 'posture',    category: 'Health & Beauty'   },
  { keyword: 'pet accessories',       niche: 'pets',       category: 'Pets'              },
  { keyword: 'dog supplies',          niche: 'pets',       category: 'Pets'              },
  { keyword: 'lumbar support brace',  niche: 'back-pain',  category: 'Health & Beauty'   },
  { keyword: 'ergonomic support',     niche: 'posture',    category: 'Sports & Outdoors' },
  { keyword: 'cat accessories',       niche: 'pets',       category: 'Pets'              },
  { keyword: 'knee pain relief',      niche: 'back-pain',  category: 'Health & Beauty'   },
]

export interface CJVariant {
  vid: string
  sku: string
  label: string       // e.g. "XL / Red"
  color?: string
  size?: string
  supplierPrice: number
  stock: number
  image?: string
}

export interface CJFullProduct {
  pid: string
  title: string
  image: string
  images: string[]
  supplierPrice: number   // base / lowest variant price
  sellPrice: number
  categoryName: string
  variants: CJVariant[]
  salesVolume?: number
  reviewCount?: number
  reviewScore?: number
  supplierScore?: number
  shippingDays?: number
}

export class CJService {
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  private get email() { return process.env.CJ_EMAIL || '' }
  private get apiKey() { return process.env.CJ_API_KEY || '' }

  // ─── AUTH ────────────────────────────────────────────────────
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }
    const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.email, password: this.apiKey })
    })
    const data = await res.json()
    if (!data.data?.accessToken) {
      throw new Error(`CJ Auth failed: ${data.message || 'Invalid credentials'}`)
    }
    this.accessToken = data.data.accessToken
    this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000
    return this.accessToken!
  }

  private async request(path: string, method = 'GET', body?: object) {
    const token = await this.getAccessToken()
    const res = await fetch(`${CJ_BASE}${path}`, {
      method,
      headers: { 'CJ-Access-Token': token, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {})
    })
    return res.json()
  }

  // ─── 1. BEST-SELLER SEARCH ───────────────────────────────────
  /**
   * Search products sorted by sales volume — best sellers FIRST.
   * Used by Llama when the user asks for products, and by the auto-scout.
   */
  async searchBestSellers(keyword: string, pageSize: number = 10): Promise<CJFullProduct[]> {
    const data = await this.request(
      `/product/list?pageNum=1&pageSize=${pageSize}&productNameEn=${encodeURIComponent(keyword)}&sortField=salesVolume&sortOrder=DESC`
    )
    const list: any[] = data.data?.list || []
    return list.map(p => this.normalizeSearchResult(p))
  }

  /**
   * Basic keyword search (fallback / original behavior).
   */
  async searchProduct(keyword: string, count = 5): Promise<CJFullProduct[]> {
    return this.searchBestSellers(keyword, count)
  }

  // ─── 2. FULL PRODUCT + ALL VARIANTS ─────────────────────────
  /**
   * Fetches the complete product detail including every variant (size/color).
   * This is called after the user picks a product to import.
   */
  async getFullProductWithVariants(pid: string): Promise<CJFullProduct | null> {
    const data = await this.request(`/product/query?pid=${pid}`)
    if (!data.data) return null
    return this.normalizeFullProduct(data.data)
  }

  /** Backward-compat alias */
  async getProduct(pid: string) {
    return this.getFullProductWithVariants(pid)
  }

  // ─── 3. PRICE + STOCK REFRESH (lightweight) ─────────────────
  /**
   * Called by the background cron job — only fetches pricing and stock per variant.
   * Avoids pulling full product detail on every poll cycle.
   */
  async refreshProductPriceAndStock(pid: string): Promise<{
    supplierPrice: number
    variants: { vid: string; stock: number; supplierPrice: number }[]
  } | null> {
    try {
      const data = await this.request(`/product/query?pid=${pid}`)
      if (!data.data) return null
      const p = data.data
      const rawPrice = String(p.sellPrice || p.productPrice || 0)
      const supplierPrice = parseFloat(rawPrice.split('-')[0]) || 0

      const variants: { vid: string; stock: number; supplierPrice: number }[] = (p.variants || []).map((v: any) => ({
        vid: String(v.vid || ''),
        stock: Number(v.variantStock ?? v.productStock ?? 0),
        supplierPrice: parseFloat(String(v.variantSellPrice || v.sellPrice || supplierPrice)) || supplierPrice,
      }))

      return { supplierPrice, variants }
    } catch {
      return null
    }
  }

  // ─── ORDER PLACEMENT ────────────────────────────────────────
  async createOrder(params: {
    orderId: string
    customerName: string
    customerPhone: string
    address: { line1: string; city: string; province: string; country: string; zip: string }
    products: Array<{ vid: string; quantity: number; price: number }>
  }) {
    const payload = {
      orderNumber: params.orderId,
      shippingZip: params.address.zip,
      shippingCountryCode: params.address.country,
      shippingProvince: params.address.province,
      shippingCity: params.address.city,
      shippingAddress: params.address.line1,
      shippingCustomerName: params.customerName,
      shippingPhone: params.customerPhone,
      products: params.products.map(p => ({ vid: p.vid, quantity: p.quantity, price: p.price })),
      shippingService: 'CJPacket Ordinary',
      remark: `Vexsen Order #${params.orderId}`
    }
    const data = await this.request('/shopping/order/createOrderByProduct', 'POST', payload)
    if (data.code !== 200) throw new Error(`CJ Order failed: ${data.message}`)
    return { success: true, cjOrderId: data.data?.orderId, orderNum: data.data?.orderNum }
  }

  // ─── ORDER STATUS ────────────────────────────────────────────
  async getOrderStatus(cjOrderId: string) {
    const data = await this.request(`/shopping/order/getOrderDetail?orderId=${cjOrderId}`)
    const order = data.data
    return {
      status: order?.orderStatus || 'unknown',
      trackingNumber: order?.trackNumber || null,
      shippingCarrier: order?.logisticName || null,
      trackingUrl: order?.trackNumber ? `https://t.17track.net/en#nums=${order.trackNumber}` : null
    }
  }

  // ─── SHIPPING ────────────────────────────────────────────────
  async getShippingOptions(pid: string, country: string) {
    const data = await this.request(
      `/logistic/freightCalculate?startCountryCode=CN&endCountryCode=${country}&quantity=1&pid=${pid}`
    )
    return data.data || []
  }

  isConfigured() {
    return !!(this.email && this.apiKey)
  }

  // ─── NORMALIZERS ─────────────────────────────────────────────
  private normalizeSearchResult(p: any): CJFullProduct {
    const rawPrice = String(p.sellPrice || p.productPrice || 0)
    const supplierPrice = parseFloat(rawPrice.split('-')[0]) || 0
    return {
      pid: String(p.pid || p.productId || ''),
      title: p.productNameEn || p.productName || 'Unknown',
      image: p.productImage || '',
      images: p.productImage ? [p.productImage] : [],
      supplierPrice,
      sellPrice: supplierPrice,
      categoryName: p.categoryName || 'General',
      variants: [],
      salesVolume: Number(p.salesVolume || p.saleNum || 0),
      reviewCount: Number(p.remark?.reviewCount || p.reviewCount || 0),
      reviewScore: Number(p.remark?.reviewScore || p.reviewScore || 0),
      supplierScore: Number(p.supplierScore || p.factoryScore || 0),
      shippingDays: Number(p.deliveryTime || 10),
    }
  }

  private normalizeFullProduct(p: any): CJFullProduct {
    const rawPrice = String(p.sellPrice || p.productPrice || 0)
    const supplierPrice = parseFloat(rawPrice.split('-')[0]) || 0

    const rawVariants: any[] = p.variants || p.productVariants || []
    const variants: CJVariant[] = rawVariants.map((v: any) => {
      // CJ uses variantProperty like "Color:Red;Size:XL"
      const props: Record<string, string> = {}
      const propStr: string = v.variantProperty || v.variantProperties || ''
      propStr.split(';').forEach((part: string) => {
        const [k, val] = part.split(':')
        if (k && val) props[k.trim().toLowerCase()] = val.trim()
      })
      const labelParts = [props['color'], props['size']].filter(Boolean)
      return {
        vid: String(v.vid || v.variantId || ''),
        sku: String(v.variantSku || v.sku || ''),
        label: labelParts.length > 0 ? labelParts.join(' / ') : 'Default',
        color: props['color'],
        size: props['size'],
        supplierPrice: parseFloat(String(v.variantSellPrice || v.sellPrice || supplierPrice)) || supplierPrice,
        stock: Number(v.variantStock ?? v.productStock ?? 0),
        image: v.variantImage || p.productImage || '',
      }
    })

    // Collect all images
    const images: string[] = []
    if (p.productImage) images.push(p.productImage)
    if (Array.isArray(p.productImages)) images.push(...p.productImages)
    if (Array.isArray(p.imageList)) images.push(...p.imageList.map((i: any) => i.imageUrl || i).filter(Boolean))
    const uniqueImages = [...new Set(images)] as string[]

    return {
      pid: String(p.pid || p.productId || ''),
      title: p.productNameEn || p.productName || 'CJ Product',
      image: uniqueImages[0] || '',
      images: uniqueImages,
      supplierPrice,
      sellPrice: supplierPrice,
      categoryName: p.categoryName || 'General',
      variants,
      salesVolume: Number(p.salesVolume || p.saleNum || 0),
      reviewCount: Number(p.remark?.reviewCount || p.reviewCount || 0),
      reviewScore: Number(p.remark?.reviewScore || p.reviewScore || 0),
      supplierScore: Number(p.supplierScore || p.factoryScore || 0),
      shippingDays: Number(p.deliveryTime || 10),
    }
  }
}

// Singleton
export const cj = new CJService()
