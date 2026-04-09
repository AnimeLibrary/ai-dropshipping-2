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
  
  const supplier: Supplier = {
    id: `kalodata-${Date.now()}`,
    name: 'Kalodata Supplier',
    url: row.supplierUrl,
    price: row.price,
    rating: 4.5, // Default for trending items
    shippingDays: 7, // Standard for non-AliExpress vetted suppliers
    isReliable: true,
    isCheapest: true
  }

  return {
    id: row.title.toLowerCase().replace(/\s+/g, '-'),
    slug: row.title.toLowerCase().replace(/\s+/g, '-'),
    title: row.title,
    category: row.category,
    price: targetPrice,
    supplierPrice: row.price,
    heroImage: row.imageUrl,
    source: 'kalodata',
    trendScore: row.trendScore,
    suppliers: [supplier],
    validationStatus: 'pending',
    adAngles: [],
    tags: [row.category, 'tiktok-shop', 'trending']
  }
}
