// ============================================================
// PRODUCT DATA LAYER
// Sources: Kalodata CSV import + Minea API + Manual validation
//
// IMPORTANT: Every product has a `validationStatus` field.
// Products must be APPROVED before pages are generated.
// This is the manual validation layer against AI-picked products.
// ============================================================

// Status machine: pending → approved → queuedForPublish → live
// 'approved' = reviewed internally. 'queuedForPublish' = batched, ready to go live.
export type ValidationStatus = 'pending' | 'approved' | 'queuedForPublish' | 'rejected'
export type ProductSource = 'kalodata' | 'minea' | 'pipiads' | 'zik' | 'manual'

export interface AdAngle {
  hook: string          // Opening line for ad
  pain: string          // Pain point addressed
  emotion: string       // Emotional trigger (fear, desire, relief)
  platform: 'tiktok' | 'facebook' | 'instagram'
  performanceScore?: number  // From Minea/Pipiads (0-100)
}

// Refined Bundle Interface for Triple-Threat strategy
export interface Bundle {
  id: string
  slug: string
  title: string
  shortDescription: string
  longDescription: string
  productIds: string[]        // Must contain exactly 3 products for Triple Threat
  price: number               // Discounted bundle price
  compareAtPrice: number      // Sum of individual prices
  heroImage: string           // Bundle hero image
  niche: string
  validationStatus: ValidationStatus
}

export interface Product {
  id: string
  slug: string
  title: string
  shortDescription: string    // 1-2 sentence pain-solution framing
  longDescription: string     // Full problem → solution → product copy
  // Pain narrative sections — power the product page emotional arc
  painNarrative?: {
    whyYoureHere: string      // Empathy hook — "You're not crazy..."
    realCause: string         // Why nothing else worked
    whyThisWorks: string      // The solution, not the pitch
  }
  price: number
  compareAtPrice?: number
  heroImage: string           // AI-enhanced emotional shot (homepage hero + product page top)
  galleryImages: string[]     // Real supplier images — proof layer (product page gallery)
  category: string
  niche: string
  tags: string[]

  // Data Pipeline Fields
  source: ProductSource
  trendScore: number          // 0-100 from Kalodata/Minea
  adAngles: AdAngle[]         // Ad copy angles from Minea/Pipiads
  keywordClusterIds: string[] // Maps to KeywordCluster.id for page generation
  stripePriceId?: string   // Populated after Stripe sync
  supplierPrice: number       // Base cost from supplier
  suppliers: Supplier[]       // List of vetted suppliers

  // MANUAL VALIDATION LAYER — AI picks must go through this
  validationStatus: ValidationStatus
  validationNotes?: string    // Reviewer notes
  validatedAt?: string        // ISO date when approved
  validatedBy?: string        // Who approved it
  // The single emotional core that becomes headlines, hooks, and ad copy
  emotionalTrigger?: string   // e.g. "fear of long-term damage", "exhaustion from lack of sleep"

  // SEO
  metaTitle?: string
  metaDescription?: string
  relatedProductIds: string[]

  // Performance (populated from analytics)
  statusTrends?: {
    ctr: number
    conversion: number
    profit: number
  }
  stockCount?: number
  bundleIds?: string[]        // Link back to bundles containing this product
}

export interface Supplier {
  id: string
  name: string
  url: string
  price: number
  rating: number
  shippingDays: number
  isReliable: boolean
  isCheapest: boolean
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
    painNarrative: {
      whyYoureHere:
        "You've tried adjusting your chair. You've tried standing. You've tried stretching between meetings. And at the end of the day your lower back still aches — the kind of dull, persistent burn you've started accepting as normal. It isn't.",
      realCause:
        "Most chairs are engineered for aesthetics, not anatomy. Without lumbar support at the exact curve of your spine, your back muscles spend all day fighting to keep you upright — and they lose. Every hour, the compression compounds.",
      whyThisWorks:
        "The LumbarPro targets the L2-L5 vertebrae — the zone most chairs completely miss. The memory foam contours to your exact curvature, restoring your spine's natural S-shape and taking the load off your muscles in minutes. No adjustment needed. It just works.",
    },
    price: 34.99,
    compareAtPrice: 59.99,
    heroImage: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=1000&auto=format&fit=crop', // Lumbar support cushion
    galleryImages: [], // Add real supplier images here
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
    emotionalTrigger: 'fear of permanent back damage from years of poor posture',
    validationStatus: 'approved',
    validatedAt: '2026-04-01',
    validatedBy: 'manual-review',
    supplierPrice: 11.50,
    suppliers: [
      { id: 'ali-1', name: 'AliExpress Direct', url: '#', price: 11.50, rating: 4.8, shippingDays: 12, isReliable: true, isCheapest: true },
      { id: 'cj-1', name: 'CJ Dropshipping', url: '#', price: 13.20, rating: 4.9, shippingDays: 8, isReliable: true, isCheapest: false }
    ],
    statusTrends: { ctr: 3.2, conversion: 2.1, profit: 4200 },
    metaTitle: 'LumbarPro Support Cushion — Fix Back Pain Fast | TrendDrop',
    metaDescription:
      'Restore your spine\'s natural curve and eliminate lower back pain in minutes. Ergonomic lumbar support for office, gaming, and home use.',
    relatedProductIds: ['posture-corrector-strap', 'standing-desk-mat'],
  },
  {
    id: 'weighted-calm-blanket',
    slug: 'weighted-calm-blanket',
    title: 'WeightedCalm Blanket',
    shortDescription:
      'Deep-pressure therapy in a blanket — calms anxiety, stops racing thoughts, and gets you to sleep faster.',
    longDescription:
      "When anxiety spikes at night, your nervous system is stuck in fight-or-flight. Weighted blankets use deep-touch pressure stimulus — the same mechanism as a firm hug — to trigger your parasympathetic nervous system and drop cortisol levels. The WeightedCalm blanket is engineered at 12lbs of even pressure distribution, breathable cotton weave, and noiseless glass bead fill. Studies show users fall asleep 48% faster and wake up less often.",
    painNarrative: {
      whyYoureHere:
        "It's late. You're exhausted — genuinely, bone-tired exhausted. But the moment you lie down your mind starts running. The same thoughts. The same low hum of worry. You've tried everything: melatonin, phone-free nights, sleep podcasts. You're still awake at 2am.",
      realCause:
        "Anxiety keeps your nervous system locked in fight-or-flight mode even when your body is still. Cortisol stays elevated, your heart rate stays slightly up, and your brain treats sleep as a threat instead of a relief. You can't think your way out of a nervous system response.",
      whyThisWorks:
        "Deep-touch pressure — the same signal as a firm hug — physically activates your parasympathetic nervous system. It's not a supplement or a trick. It's biology. The WeightedCalm blanket delivers 12lbs of even pressure that drops cortisol and lets your body actually surrender to sleep.",
    },
    price: 79.99,
    compareAtPrice: 129.99,
    heroImage: 'https://images.unsplash.com/photo-1511974240194-e0eb3f5022dc?q=80&w=1000&auto=format&fit=crop', // Weighted blanket
    galleryImages: [], // Add real supplier images here
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
    emotionalTrigger: 'exhaustion from years of broken, anxious sleep',
    validationStatus: 'pending',
    validationNotes: 'Verify supplier MOQ and shipping time before approving',
    relatedProductIds: ['sleep-eye-mask', 'white-noise-machine'],
    supplierPrice: 22.00,
    suppliers: [
      { id: 'ali-2', name: 'AliExpress Direct', url: '#', price: 21.50, rating: 4.6, shippingDays: 14, isReliable: true, isCheapest: true }
    ],
    statusTrends: { ctr: 4.5, conversion: 1.8, profit: 5600 },
  },
  {
    id: 'furroll-pet-hair-remover',
    slug: 'furroll-pet-hair-remover',
    title: 'FurRoll Self-Cleaning Pet Hair Remover',
    shortDescription:
      'One swipe removes pet hair from any surface — self-cleaning base, no refills, no tape.',
    longDescription:
      "Pet hair is the invisible tax of dog ownership. It coats your couch, clothes, car seats — and lint rollers eat through tape rolls faster than you think. FurRoll uses electrostatic bristle technology to pick up hair on the forward stroke and eject it on the return. One swipe covers 6x the area of lint tape. No refills, no sticky residue, no embarrassment when guests arrive.",
    painNarrative: {
      whyYoureHere:
        "Your couch has more of your dog on it than you do. Guests are coming over and you've already lint-rolled the cushions three times. The tape roll is half gone. You love your pet — you're just tired of the tax that comes with it.",
      realCause:
        "Standard lint rollers and tape strips only pick up surface hair and leave the embedded strands behind. Pet hair works itself into fabric weaves at an angle that adhesive can't reverse. You'd need to tape the entire couch to get it right — which is why you never feel like you're winning.",
      whyThisWorks:
        "FurRoll's electrostatic bristles pick up hair on the forward stroke and eject it into the self-cleaning base on the return — no tape, no refills, no residue. One swipe covers the width of an entire cushion. Guests arrive and you stop apologizing for the couch.",
    },
    price: 24.99,
    compareAtPrice: 39.99,
    heroImage: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=1000&auto=format&fit=crop', // Pet grooming/dog hair context
    galleryImages: [], // Add real supplier images here
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
    emotionalTrigger: 'embarrassment from pet hair in front of guests',
    validationStatus: 'approved',
    validatedAt: '2026-04-02',
    validatedBy: 'manual-review',
    relatedProductIds: ['pet-couch-protector'],
    supplierPrice: 6.80,
    suppliers: [
      { id: 'ali-3', name: 'AliExpress Direct', url: '#', price: 6.80, rating: 4.7, shippingDays: 10, isReliable: true, isCheapest: true }
    ],
    statusTrends: { ctr: 2.9, conversion: 3.4, profit: 3100 },
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

/** Products approved but waiting to be batched and published */
export function getQueuedForPublishProducts(): Product[] {
  return products.filter((p) => p.validationStatus === 'queuedForPublish')
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

// ============================================================
// AI LAYER — Automated Content Generation
// ============================================================

/** 
 * AI IMAGE FETCHING LAYER 
 * Automatically pull real product images from the internet
 * In production, this would call a real-time product search/scraper.
 * For now, it maps known product IDs to high-quality internet sources.
 */
export async function fetchProductImageFromInternet(product: Product): Promise<string> {
  const internetPlaceholders: Record<string, string> = {
    'lumbar-pro-cushion': 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80',
    'weighted-calm-blanket': 'https://images.unsplash.com/photo-1511974240194-e0eb3f5022dc?q=80',
    'furroll-pet-hair-remover': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80',
  }
  
  return internetPlaceholders[product.id] || product.heroImage
}
