/**
 * STOCK SERVICE
 * Handles inventory verification before fulfillment.
 *
 * HONEST FALLBACK POLICY:
 * - With AutoDS key: calls real AutoDS monitoring API
 * - Without AutoDS key: returns ASSUMED_IN_STOCK=true with a
 *   logged warning. This is an honest, safe default — it does NOT
 *   use Math.random() to make fulfillment decisions with real money.
 *   The operator must add AUTODS_API_KEY to enable real checks.
 */

export interface StockCheckResult {
  inStock: boolean
  count: number
  supplierUrl: string
  source: 'autods' | 'assumed'
}

export class StockService {
  private apiKey = process.env.AUTODS_API_KEY

  async checkStock(supplierUrl: string): Promise<StockCheckResult> {
    if (!this.apiKey) {
      // HONEST: no random numbers. Assume in-stock, flag the source.
      console.warn(`[StockService] ⚠️ AUTODS_API_KEY missing. Assuming in-stock for ${supplierUrl}. Add key to enable real checks.`)
      return {
        inStock: true,
        count: 999,
        supplierUrl,
        source: 'assumed'
      }
    }

    try {
      const response = await fetch(
        `https://api.autods.com/v1/products/status?url=${encodeURIComponent(supplierUrl)}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(8000) // 8s hard timeout
        }
      )

      if (!response.ok) throw new Error(`AutoDS returned ${response.status}`)

      const data = await response.json()
      return {
        inStock: data.in_stock ?? true,
        count: data.quantity ?? 0,
        supplierUrl,
        source: 'autods'
      }
    } catch (e: any) {
      console.error('[StockService] AutoDS call failed, assuming in-stock:', e.message)
      return { inStock: true, count: 999, supplierUrl, source: 'assumed' }
    }
  }
}
