/**
 * CJ DROPSHIPPING API SERVICE v2
 * Priority flow: Sales Volume → Supplier Score → Margin
 * Supports: best-seller discovery, full variant fetch, background price sync
 */

import { prisma } from '@/lib/db/prisma'

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
    // CJ API 2.0 expects { apiKey: "..." }
    const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: this.apiKey })
    })
    const data = await res.json()
    if (!data.data?.accessToken) {
      throw new Error(`CJ Auth failed: ${data.message || 'Invalid credentials'}`)
    }
    this.accessToken = data.data.accessToken
    this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000
    return this.accessToken!
  }

  private lastRequestTime: number = 0

  private async request(path: string, method = 'GET', body?: object, retries = 3): Promise<any> {
    // Respect CJ's strict 1 QPS (1 request / second) rate limit
    const now = Date.now()
    const elapsed = now - this.lastRequestTime
    if (elapsed < 1100) {
      await new Promise(r => setTimeout(r, 1100 - elapsed))
    }
    this.lastRequestTime = Date.now()

    const token = await this.getAccessToken()
    const res = await fetch(`${CJ_BASE}${path}`, {
      method,
      headers: { 'CJ-Access-Token': token, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {})
    })
    const data = await res.json().catch(() => null)

    // Check for 429 / QPS throttling and auto-retry
    if (data?.code === 429 || data?.message?.includes('QPS limit') || data?.message?.includes('Too Many Requests')) {
      if (retries > 0) {
        console.warn(`[CJ QPS Throttled] Backing off 1.3s, retries left: ${retries}`)
        await new Promise(r => setTimeout(r, 1300))
        return this.request(path, method, body, retries - 1)
      }
    }

    return data
  }

  // ─── 1. BEST-SELLER SEARCH ───────────────────────────────────
  /**
   * Smart CJ Search:
   * 1. Direct PID or CJ URL detection
   * 2. CJ SKU lookup
   * 3. Best-seller search sorted by sales volume
   * 4. Fallback search without sales volume sort (catches newer/unranked products)
   * 5. Fuzzy 2-word keyword fallback for long-tail queries
   */
  async searchBestSellers(keyword: string, pageSize: number = 16): Promise<CJFullProduct[]> {
    const raw = (keyword || '').trim()
    if (!raw) return []

    // Strategy 1: Direct PID or CJ URL detection
    let directPid: string | null = null
    if (/^\d{10,}$/.test(raw)) {
      directPid = raw
    } else {
      const urlMatch = raw.match(/cjdropshipping\.com\/product\/.*?(\d{10,})\.html/) ||
                       raw.match(/-p-(\d{10,})\.html/) ||
                       raw.match(/[?&]pid=(\d{10,})/)
      if (urlMatch) {
        directPid = urlMatch[1]
      }
    }

    if (directPid) {
      const single = await this.getFullProductWithVariants(directPid)
      if (single) return [single]
    }

    // Strategy 2: CJ SKU lookup (e.g., CJJJT...)
    if (/^CJ[A-Z0-9_-]{5,}$/i.test(raw)) {
      const skuData = await this.request(
        `/product/list?pageNum=1&pageSize=${pageSize}&productSku=${encodeURIComponent(raw)}`
      )
      const skuList: any[] = skuData?.data?.list || []
      if (skuList.length > 0) {
        return skuList.map(p => this.normalizeSearchResult(p))
      }
    }

    // Sanitize keyword: remove punctuation/special characters that choke CJ's search engine
    const cleanKw = raw.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim()

    // Strategy 3: Best-seller search sorted by salesVolume
    let data = await this.request(
      `/product/list?pageNum=1&pageSize=${pageSize}&productNameEn=${encodeURIComponent(cleanKw)}&sortField=salesVolume&sortOrder=DESC`
    )
    let list: any[] = data?.data?.list || []

    // Strategy 4: Fallback without sortField (newer or unranked items without salesVolume scores)
    if (list.length === 0) {
      data = await this.request(
        `/product/list?pageNum=1&pageSize=${pageSize}&productNameEn=${encodeURIComponent(cleanKw)}`
      )
      list = data?.data?.list || []
    }

    // Strategy 5: Fuzzy fallback for long queries (extract primary tokens)
    if (list.length === 0 && cleanKw.split(' ').length > 2) {
      const shortKw = cleanKw.split(' ').slice(0, 2).join(' ')
      data = await this.request(
        `/product/list?pageNum=1&pageSize=${pageSize}&productNameEn=${encodeURIComponent(shortKw)}&sortField=salesVolume&sortOrder=DESC`
      )
      list = data?.data?.list || []
    }

    return list.map(p => this.normalizeSearchResult(p))
  }

  /**
   * Basic keyword search (fallback / original behavior).
   */
  async searchProduct(keyword: string, count = 16): Promise<CJFullProduct[]> {
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

  /**
   * Directly imports a CJ product by PID into the Prisma database with all variants and suppliers.
   */
  async importProduct(pid: string, niche = 'general', markupFactor = 2.5, customRetailPrice?: number, customCompareAtPrice?: number, customTitle?: string) {
    const full = await this.getFullProductWithVariants(pid)
    if (!full) throw new Error(`CJ product ${pid} not found`)

    // Check if already in DB
    const existing = await prisma.product.findFirst({
      where: { cjProductId: pid },
      include: { variants: true }
    })
    if (existing) {
      return existing
    }

    const titleToUse = customTitle || full.title
    const baseSlug = titleToUse
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 45) || 'product'
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`

    const retailPrice = customRetailPrice && customRetailPrice > 0 
      ? customRetailPrice 
      : Math.round(full.supplierPrice * markupFactor * 100) / 100
    const compareAtPrice = customCompareAtPrice && customCompareAtPrice > 0
      ? customCompareAtPrice
      : Math.round(retailPrice * 1.4 * 100) / 100

    const created = await prisma.product.create({
      data: {
        slug,
        title: titleToUse,
        shortDescription: `Premium engineered ${niche.replace(/-/g, ' ')} solution. Built for daily comfort, superior durability, and proven results.`,
        category: full.categoryName || 'General',
        niche,
        price: retailPrice,
        compareAtPrice,
        supplierPrice: full.supplierPrice,
        heroImage: full.images && full.images.length > 0 ? JSON.stringify(full.images) : full.image,
        trendScore: 90,
        source: 'CJ Dropshipping',
        validationStatus: 'pending',
        cjProductId: full.pid,
        cjVariantId: full.variants[0]?.vid || null,
        cjVariants: full.variants as any,
        cjSalesRank: full.salesVolume || null,
        cjSupplierScore: full.supplierScore || null,
        cjLastSyncedAt: new Date(),
        variants: {
          create: full.variants.map((v, idx) => ({
            vid: v.vid,
            sku: v.sku,
            label: v.label,
            color: v.color || null,
            size: v.size || null,
            supplierPrice: v.supplierPrice,
            retailPrice: Math.round(v.supplierPrice * markupFactor * 100) / 100,
            cjStock: v.stock,
            image: v.image || full.image,
            isDefault: idx === 0,
          }))
        },
        suppliers: {
          create: {
            name: 'CJ Dropshipping',
            url: `https://cjdropshipping.com/product/${full.pid}.html`,
            price: full.supplierPrice,
            shippingDays: full.shippingDays || 10,
            isReliable: true,
            isCheapest: true
          }
        }
      },
      include: {
        variants: true,
        suppliers: true
      }
    })

    return created
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
  private extractImages(p: any): string[] {
    const images: string[] = []
    const addImg = (val: any) => {
      if (!val) return
      if (Array.isArray(val)) {
        val.forEach(item => addImg(item))
      } else if (typeof val === 'string') {
        const trimmed = val.trim()
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed)) {
              parsed.forEach(item => addImg(item))
              return
            }
          } catch {}
        }
        if (trimmed.includes(',')) {
          trimmed.split(',').forEach(sub => addImg(sub))
          return
        }
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          if (!images.includes(trimmed)) images.push(trimmed)
        }
      }
    }

    addImg(p.productImageSet)
    addImg(p.productImage)
    addImg(p.productImages)
    addImg(p.bigImage)
    addImg(p.imageList)
    if (Array.isArray(p.variants || p.productVariants)) {
      (p.variants || p.productVariants).forEach((v: any) => addImg(v?.variantImage))
    }
    if (p.productVideo) addImg(p.productVideo)

    return images
  }

  private normalizeSearchResult(p: any): CJFullProduct {
    const rawPrice = String(p.sellPrice || p.productPrice || 0)
    const supplierPrice = parseFloat(rawPrice.split('-')[0]) || 0
    const images = this.extractImages(p)
    return {
      pid: String(p.pid || p.productId || ''),
      title: p.productNameEn || p.productName || 'Unknown',
      image: images[0] || '',
      images,
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

    const uniqueImages = this.extractImages(p)

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
