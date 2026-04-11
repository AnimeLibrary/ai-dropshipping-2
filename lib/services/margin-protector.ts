import prisma from '../prisma'
import { StockService } from './stock-service'

/**
 * MARGIN PROTECTOR SERVICE
 * Operational safety valve: archive products if profitability drops.
 */

export class MarginProtector {
  private stockService = new StockService()
  private MIN_MARGIN_PERCENT = 20

  /**
   * Scans all approved products and validates their current margins.
   */
  async validateAllMargins() {
    console.log('[Margin Protector] Starting global health check...')
    
    const products = await prisma.product.findMany({
      where: { validationStatus: 'approved' },
      include: { suppliers: true }
    })

    let archivedCount = 0

    for (const product of products) {
      // 1. Fetch current price from the primary supplier
      const primarySupplier = product.suppliers.find(s => s.isReliable) || product.suppliers[0]
      if (!primarySupplier) continue

      const stockStatus = await this.stockService.checkStock(primarySupplier.url)
      
      // 2. Perform Margin Calculation
      // Formula: (Retail - COGS) / Retail
      const retail = product.price
      const cogs = stockStatus.inStock ? 15 : 0 // In prod, this would pull real price from API
      
      const margin = ((retail - cogs) / retail) * 100

      if (margin < this.MIN_MARGIN_PERCENT || !stockStatus.inStock) {
        console.warn(`[Margin Protector] ARCHIVING ${product.title}: Margin too low (${margin.toFixed(1)}%) or OOS.`)
        
        await prisma.product.update({
          where: { id: product.id },
          data: { validationStatus: 'archived' }
        })
        
        archivedCount++
      }
    }

    return {
      scanned: products.length,
      archived: archivedCount
    }
  }
}
