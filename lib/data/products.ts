// ============================================================
// PRODUCT DATA LAYER
// Sources: Kalodata CSV import + Minea API + Manual validation
//
// IMPORTANT: Every product has a `validationStatus` field.
// Products must be APPROVED before pages are generated.
// This is the manual validation layer against AI-picked products.
// ============================================================

export type ValidationStatus = 'pending' | 'approved' | 'rejected'
export type ProductSource = 'kalodata' | 'minea' | 'pipiads' | 'zik' | 'manual'

export interface AdAngle {
  hook: string          // Opening line for ad
  pain: string          // Pain point addressed
  emotion: string       // Emotional trigger (fear, desire, relief)
  platform: 'tiktok' | 'facebook' | 'instagram'
  performanceScore?: number  // From Minea/Pipiads (0-100)
}

export interface ProductBundle {
  id: string
  name: string
  productIds: string[]  // IDs of bundled products
  savings: number       // $ saved vs buying individually
  headline: string      // Bundle storytelling headline
}

export interface Product {
  id: string
  slug: string
  title: string
  shortDescription: string    // 1-2 sentence pain-solution framing
  longDescription: string     // Full problem → solution → product copy
  price: number
  compareAtPrice?: number
  images: string[]            // CDN URLs (Shopify or uploaded)
  category: string
  niche: string
  tags: string[]

  // Data Pipeline Fields
  source: ProductSource
  trendScore: number          // 0-100 from Kalodata/Minea
  adAngles: AdAngle[]         // Ad copy angles from Minea/Pipiads
  keywordClusterIds: string[] // Maps to KeywordCluster.id for page generation
  stripePriceId?: string   // Populated after Stripe sync
  supplierUrl?: string        // AliExpress/CJ supplier URL

  // MANUAL VALIDATION LAYER — AI picks must go through this
  validationStatus: ValidationStatus
  validationNotes?: string    // Reviewer notes
  validatedAt?: string        // ISO date when approved
  validatedBy?: string        // Who approved it

  // SEO
  metaTitle?: string
  metaDescription?: string
  relatedProductIds: string[]

  // Performance (populated from analytics)
  ctr?: number
  conversionRate?: number
  addToCartRate?: number
}

// ============================================================
// SEED PRODUCTS — Replace with real Kalodata CSV imports
// ============================================================
export const products: Product[] = [
  {
    id: 'lumbar-pro-cushion',
    slug: 'lumbar-pro-support-cushion',
    title: 'LumbarPro Support Cushion',
    shortDescription:
      'Engineered lumbar support that eliminates lower back pain during long sitting sessions — in under 10 minutes of use.',
    longDescription:
      "Your lower back wasn't designed for 8-hour sitting marathons. Most chairs provide zero lumbar support, forcing your spine into a C-shape that compresses discs and strains muscles. The LumbarPro sits at the exact curvature point your chair misses — restoring the natural S-curve of your spine, decompressing pressure points, and eliminating that burning ache within minutes. Whether you're gaming, working from home, or commuting, it moves with you.",
    price: 34.99,
    compareAtPrice: 59.99,
    images: [],
    category: 'Ergonomics',
    niche: 'back-pain',
    tags: ['lumbar', 'ergonomic', 'office', 'chair', 'posture'],
    source: 'kalodata',
    trendScore: 82,
    adAngles: [
      {
        hook: 'POV: You stopped having back pain at work',
        pain: 'Chronic lower back pain from sitting all day',
        emotion: 'relief',
        platform: 'tiktok',
        performanceScore: 87,
      },
      {
        hook: 'I tried 12 "solutions" for back pain. This was the only one that worked.',
        pain: 'Frustration with ineffective solutions',
        emotion: 'trust',
        platform: 'facebook',
        performanceScore: 74,
      },
    ],
    keywordClusterIds: ['lumbar-support-comparison', 'wfh-neck-pain', 'back-pain-gaming'],
    validationStatus: 'approved',
    validatedAt: '2026-04-01',
    validatedBy: 'manual-review',
    metaTitle: 'LumbarPro Support Cushion — Fix Back Pain Fast | TrendDrop',
    metaDescription:
      'Restore your spine\'s natural curve and eliminate lower back pain in minutes. Ergonomic lumbar support for office, gaming, and home use.',
    relatedProductIds: ['posture-corrector-strap', 'standing-desk-mat'],
    trendScore: 82,
  },
  {
    id: 'weighted-calm-blanket',
    slug: 'weighted-calm-blanket',
    title: 'WeightedCalm Blanket',
    shortDescription:
      'Deep-pressure therapy in a blanket — calms anxiety, stops racing thoughts, and gets you to sleep faster.',
    longDescription:
      "When anxiety spikes at night, your nervous system is stuck in fight-or-flight. Weighted blankets use deep-touch pressure stimulus — the same mechanism as a firm hug — to trigger your parasympathetic nervous system and drop cortisol levels. The WeightedCalm blanket is engineered at 12lbs of even pressure distribution, breathable cotton weave, and noiseless glass bead fill. Studies show users fall asleep 48% faster and wake up less often.",
    price: 79.99,
    compareAtPrice: 129.99,
    images: [],
    category: 'Sleep',
    niche: 'sleep',
    tags: ['weighted blanket', 'anxiety', 'sleep', 'calm'],
    source: 'minea',
    trendScore: 91,
    adAngles: [
      {
        hook: 'I haven\'t slept properly in 3 years. Until I tried this.',
        pain: 'Chronic sleep deprivation from anxiety',
        emotion: 'hope',
        platform: 'tiktok',
        performanceScore: 92,
      },
      {
        hook: 'Anxiety at 2am? This is what your nervous system actually needs.',
        pain: 'Racing thoughts preventing sleep',
        emotion: 'education',
        platform: 'facebook',
        performanceScore: 81,
      },
    ],
    keywordClusterIds: ['sleep-quality'],
    validationStatus: 'pending',
    validationNotes: 'Verify supplier MOQ and shipping time before approving',
    relatedProductIds: ['sleep-eye-mask', 'white-noise-machine'],
    trendScore: 91,
  },
  {
    id: 'furroll-pet-hair-remover',
    slug: 'furroll-pet-hair-remover',
    title: 'FurRoll Self-Cleaning Pet Hair Remover',
    shortDescription:
      'One swipe removes pet hair from any surface — self-cleaning base, no refills, no tape.',
    longDescription:
      "Pet hair is the invisible tax of dog ownership. It coats your couch, clothes, car seats — and lint rollers eat through tape rolls faster than you think. FurRoll uses electrostatic bristle technology to pick up hair on the forward stroke and eject it on the return. One swipe covers 6x the area of lint tape. No refills, no sticky residue, no embarrassment when guests arrive.",
    price: 24.99,
    compareAtPrice: 39.99,
    images: [],
    category: 'Pet Care',
    niche: 'pet-care',
    tags: ['pet hair', 'dog', 'cat', 'lint roller', 'couch'],
    source: 'kalodata',
    trendScore: 76,
    adAngles: [
      {
        hook: 'Dog hair on your couch? Watch this.',
        pain: 'Pet hair covering all furniture',
        emotion: 'satisfaction',
        platform: 'tiktok',
        performanceScore: 88,
      },
    ],
    keywordClusterIds: ['pet-hair-everywhere'],
    validationStatus: 'approved',
    validatedAt: '2026-04-02',
    validatedBy: 'manual-review',
    relatedProductIds: ['pet-couch-protector'],
    trendScore: 76,
  },
]

// ============================================================
// HELPERS
// ============================================================

/** Only approved products generate live pages */
export function getApprovedProducts(): Product[] {
  return products.filter((p) => p.validationStatus === 'approved')
}

/** Products pending review — for admin dashboard */
export function getPendingProducts(): Product[] {
  return products.filter((p) => p.validationStatus === 'pending')
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}

export function getProductsByNiche(niche: string): Product[] {
  return getApprovedProducts().filter((p) => p.niche === niche)
}

/** Top trending approved products for homepage */
export function getTrendingProducts(limit = 6): Product[] {
  return getApprovedProducts()
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, limit)
}
