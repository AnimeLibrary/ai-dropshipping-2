import { Product, Supplier } from './products'
import { calculateTargetPrice } from '../utils/pricing'

/**
 * KALODATA CSV IMPORTER
 * Processes TikTok Shop trending data from Kalodata exports.
 * 
 * Expected CSV Fields (Standard Kalodata):
 * - Product Name / title
 * - Category
 * - Revenue / Revenue (30d)
 * - Sales / Sales (30d)
 * - Unit Price / price
 * - Supplier URL / Supplier Link
 * - Main Image / image
 */

export interface KalodataRow {
  title: string
  category: string
  revenue: number
  price: number // Supplier Cost
  supplierUrl: string
  imageUrl: string
  trendScore: number // Calculated from revenue growth
}

export function transformKalodataToProduct(row: KalodataRow): Partial<Product> {
  const targetPrice = calculateTargetPrice(row.price)
  
  // Sanitize imageUrl (Kalodata/CJ often send stringified arrays ["url1", "url2"])
  let heroImage = row.imageUrl || '/placeholder.png'
  try {
    if (typeof heroImage === 'string' && heroImage.startsWith('[')) {
      const parsed = JSON.parse(heroImage)
      if (Array.isArray(parsed) && parsed.length > 0) {
        heroImage = parsed[0]
      }
    }
  } catch (e) {
    console.warn('[Importer] Failed to parse imageUrl:', heroImage)
  }

  const supplier: Supplier = {
    id: `kalodata-${Date.now()}`,
    name: 'Kalodata Supplier',
    url: row.supplierUrl,
    price: Number(row.price || 0),
    rating: 4.5,
    shippingDays: 7,
    isReliable: true,
    isCheapest: true
  }

  return {
    id: row.title.toLowerCase().replace(/\s+/g, '-'),
    slug: row.title.toLowerCase().replace(/\s+/g, '-'),
    title: row.title,
    category: row.category,
    price: Number(targetPrice || 0),
    supplierPrice: Number(row.price || 0),
    heroImage: heroImage,
    source: 'kalodata',
    trendScore: Number(row.trendScore || 0),
    suppliers: [supplier],
    validationStatus: 'pending',
    adAngles: [],
    tags: [row.category, 'tiktok-shop', 'trending'].filter(Boolean) as string[]
  }
}
