/**
 * CJ DROPSHIPPING API SERVICE
 * Free API — no monthly fees. Handles product sourcing + order fulfillment automatically.
 * Docs: https://developers.cjdropshipping.com
 */

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

export class CJService {
  private email = process.env.CJ_EMAIL || ''
  private apiKey = process.env.CJ_API_KEY || ''
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  // ─── AUTH ────────────────────────────────────────────────────
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (tokens last ~24h)
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
    this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000 // 23 hours
    return this.accessToken!
  }

  private async request(path: string, method = 'GET', body?: object) {
    const token = await this.getAccessToken()
    const res = await fetch(`${CJ_BASE}${path}`, {
      method,
      headers: {
        'CJ-Access-Token': token,
        'Content-Type': 'application/json'
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    })
    return res.json()
  }

  // ─── PRODUCT SEARCH ─────────────────────────────────────────
  async searchProduct(keyword: string) {
    const data = await this.request(`/product/list?pageNum=1&pageSize=5&productNameEn=${encodeURIComponent(keyword)}`)
    return data.data?.list || []
  }

  // ─── PRODUCT DETAILS ────────────────────────────────────────
  async getProduct(pid: string) {
    const data = await this.request(`/product/query?pid=${pid}`)
    return data.data || null
  }

  // ─── CREATE ORDER ────────────────────────────────────────────
  /**
   * Fully automated: places the order on CJ which sources + ships to customer.
   * CJ charges your account balance. Make sure you have funds loaded.
   */
  async createOrder(params: {
    orderId: string             // Your internal order ID (used as reference)
    customerName: string
    customerPhone: string
    address: {
      line1: string
      city: string
      province: string          // State
      country: string           // e.g. "US"
      zip: string
    }
    products: Array<{
      vid: string               // CJ variant ID
      quantity: number
      price: number
    }>
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
      products: params.products.map(p => ({
        vid: p.vid,
        quantity: p.quantity,
        price: p.price
      })),
      shippingService: 'CJPacket Ordinary', // Free standard shipping
      remark: `TrendDrop Order #${params.orderId}`
    }

    const data = await this.request('/shopping/order/createOrderByProduct', 'POST', payload)

    if (data.code !== 200) {
      throw new Error(`CJ Order failed: ${data.message}`)
    }

    return {
      success: true,
      cjOrderId: data.data?.orderId,
      orderNum: data.data?.orderNum
    }
  }

  // ─── ORDER STATUS / TRACKING ─────────────────────────────────
  async getOrderStatus(cjOrderId: string) {
    const data = await this.request(`/shopping/order/getOrderDetail?orderId=${cjOrderId}`)
    const order = data.data

    return {
      status: order?.orderStatus || 'unknown',
      trackingNumber: order?.trackNumber || null,
      shippingCarrier: order?.logisticName || null,
      trackingUrl: order?.trackNumber
        ? `https://t.17track.net/en#nums=${order.trackNumber}`
        : null
    }
  }

  // ─── GET SHIPPING COST ───────────────────────────────────────
  async getShippingOptions(pid: string, country: string) {
    const data = await this.request(
      `/logistic/freightCalculate?startCountryCode=CN&endCountryCode=${country}&quantity=1&pid=${pid}`
    )
    return data.data || []
  }

  isConfigured() {
    return !!(this.email && this.apiKey)
  }
}

// Singleton
export const cj = new CJService()
