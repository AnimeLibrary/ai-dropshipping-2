import prisma from '../prisma'

export interface SupplierVerification {
  isSafe: boolean
  url: string
  reason?: string
}

/**
 * Checks if a product is still profitable and finds the best supplier link.
 * Logic: Price - SupplierCost must be >= $20 (User's rule)
 */
export async function verifyMarginAndGetSupplier(productId: string): Promise<SupplierVerification> {
  // 1. Fetch from DB instead of local mockup
  const product = await prisma.product.findUnique({
    where: { slug: productId },
    include: { suppliers: true }
  })
  
  if (!product) {
    return { isSafe: false, url: '', reason: 'Product not found in database' }
  }

  // 2. Get current supplier cost
  const currentSupplier = product.suppliers.find(s => s.isReliable) || product.suppliers[0]
  
  if (!currentSupplier) {
    return { isSafe: false, url: '', reason: 'No vetted suppliers found' }
  }

  const margin = product.price - currentSupplier.price

  // 3. Margin Guard ($20 Minimum)
  if (margin < 20) {
    // Attempt fallback to a cheaper reliable supplier
    const cheaperSupplier = product.suppliers
      .filter((s: any) => s.isReliable && s.price < currentSupplier.price)
      .sort((a: any, b: any) => a.price - b.price)[0]

    if (cheaperSupplier && (product.price - cheaperSupplier.price) >= 20) {
      console.log(`[Margin Guard] Switched to cheaper fallback: ${cheaperSupplier.name}`)
      return { isSafe: true, url: cheaperSupplier.url }
    }

    return { isSafe: false, url: currentSupplier.url, reason: `Margin too low ($${margin.toFixed(2)})` }
  }

  return { isSafe: true, url: currentSupplier.url }
}

