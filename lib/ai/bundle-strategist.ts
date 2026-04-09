import { Product } from '../data/products'
import { Bundle } from '../data/products'

/**
 * AI BUNDLE STRATEGIST
 * Logic to identify "Triple Threat" bundles (3 products that solve one big pain).
 */

export interface BundleProposal {
  title: string
  hook: string
  description: string
  products: Product[]
  targetPrice: number
  totalIndividualPrice: number
}

/**
 * Analyzes a list of products and proposes exactly 3-product bundles.
 * Targets the 'Sweet Spot' (High growth, compatible niches).
 */
export function proposeTripleBundles(availableProducts: Product[]): BundleProposal[] {
  // 1. Group by niche
  const nicheMap: Record<string, Product[]> = {}
  availableProducts.forEach(p => {
    if (!nicheMap[p.niche]) nicheMap[p.niche] = []
    nicheMap[p.niche].push(p)
  })

  const proposals: BundleProposal[] = []

  // 2. For each niche, if we have >= 3 products, create a Triple Threat
  for (const niche in nicheMap) {
    const items = nicheMap[niche]
    if (items.length >= 3) {
      // Pick top 3 by trendScore
      const triple = items.sort((a, b) => b.trendScore - a.trendScore).slice(0, 3)
      
      const totalIndividualPrice = triple.reduce((sum, p) => sum + p.price, 0)
      // Apply 3-product bundle discount (approx 15-20% off)
      const targetPrice = Math.floor(totalIndividualPrice * 0.8) + 0.99

      proposals.push({
        title: `The Ultimate ${niche.charAt(0).toUpperCase() + niche.slice(1)} Relief Kit`,
        hook: `3 steps to finally solve your ${niche} problem.`,
        description: `Experience total relief by tackling ${niche} from three different angles. This bundle combines our top-rated ${triple[0].title}, ${triple[1].title}, and ${triple[2].title} into one synergistic solution.`,
        products: triple,
        targetPrice,
        totalIndividualPrice
      })
    }
  }

  // Ensure we don't return more than 3 bundles as per user request
  return proposals.slice(0, 3)
}
