import prisma from '../prisma'

/**
 * FULFILLMENT SAFETY VALVE
 * Specifically designed for the 'Broke Dropshipper' scenario to prevent capital loss.
 * Protecting margins and handling repeated failures automatically.
 */

export class FulfillmentSafety {
  private static FAIL_THRESHOLD = 3
  private static PRICE_SHOCK_THRESHOLD = 0.15 // 15%

  /**
   * Checks if we should proceed with fulfillment.
   * Protects against price spikes and repeated API failures.
   */
  async shouldProceed(productId: string, currentRetail: number, supplierCost: number): Promise<{ proceed: boolean; reason?: string }> {
    // 1. Margin Guard ($20 Minimum)
    const margin = currentRetail - supplierCost
    
    if (margin < 20) {
      return { proceed: false, reason: `Margin Error: Current margin is $${margin.toFixed(2)}, which is below your $20 safety setpoint.` }
    }

    // 2. Price Shock Protection (Enterprise Grade)
    // Compare against the last known supplier price in the DB
    const lastPriceLog = await prisma.priceLog.findFirst({
      where: { productId },
      orderBy: { timestamp: 'desc' }
    })

    if (lastPriceLog) {
      const priceIncrease = (supplierCost - lastPriceLog.supplierPrice) / lastPriceLog.supplierPrice
      if (priceIncrease > FulfillmentSafety.PRICE_SHOCK_THRESHOLD) {
        return { 
          proceed: false, 
          reason: `Price Shock: Supplier cost increased by ${(priceIncrease * 100).toFixed(1)}% suddenly ($${lastPriceLog.supplierPrice.toFixed(2)} -> $${supplierCost.toFixed(2)}).` 
        }
      }
    }

    // 3. Log current price for future safety checks
    await prisma.priceLog.create({
      data: {
        productId,
        supplierPrice: supplierCost,
        retailPrice: currentRetail
      }
    })

    return { proceed: true }
  }

  /**
   * Logic to pause the system after repeated failures.
   */
  async handleFailure(orderId: string, errorCount: number): Promise<boolean> {
    if (errorCount >= FulfillmentSafety.FAIL_THRESHOLD) {
      console.error(`[SAFETY VALVE] TRIPPED. Too many failures. Disabling Auto-Order.`)
      return true // System should pause
    }
    return false
  }
}

