/**
 * AI PRICING ENGINE
 * Ensures maximum profitability based on supplier costs.
 */

/**
 * Calculates current price based on specific margin rules:
 * 1. Standard 3x markup (300% profit).
 * 2. Minimum $20 net margin (profit).
 * 
 * Formula: max(SupplierPrice * 3, SupplierPrice + 20)
 */
export function calculateTargetPrice(supplierPrice: number): number {
  const threeXPrice = supplierPrice * 3
  const twentyMarginPrice = supplierPrice + 20
  
  // Use whichever results in the higher final price
  return Math.max(threeXPrice, twentyMarginPrice)
}

/**
 * Calculates the current margin in dollars and percentage
 */
export function calculateProfitStats(price: number, cost: number) {
  const profit = price - cost
  const marginPercentage = (profit / price) * 100
  
  return {
    profit,
    marginPercentage
  }
}
