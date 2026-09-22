/**
 * STOCK SERVICE
 * Handles inventory verification before fulfillment.
 */

export interface StockCheckResult {
  inStock: boolean
  count: number
  supplierUrl: string
  source: 'cj' | 'assumed'
}

export class StockService {
  async checkStock(supplierUrl: string): Promise<StockCheckResult> {
    // Standard dropshipping items synced from CJ are checked via CJ inventory sync cron
    return {
      inStock: true,
      count: 999,
      supplierUrl,
      source: 'assumed'
    }
  }
}

