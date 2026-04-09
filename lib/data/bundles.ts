import { Bundle } from './products'

/**
 * BUNDLE DATA LAYER
 */

export const bundles: Bundle[] = [
  {
    id: 'ultimate-sleep-bundle',
    slug: 'ultimate-insomnia-rescue-bundle',
    title: 'The Ultimate Insomnia Rescue Bundle',
    shortDescription: 'The clinically-proven triple threat to racing thoughts and broken sleep.',
    longDescription: 'When one solution isn\'t enough, the Insomnia Rescue Bundle covers every sensory angle: deep-touch pressure via the Weighted Blanket, total light blackout via the Silk Eye Mask, and auditory isolation via the White Noise machine. Together, they force your nervous system into restorative parasympathetic mode in under 15 minutes.',
    productIds: ['weighted-calm-blanket', 'sleep-eye-mask', 'white-noise-machine'],
    price: 119.99,
    compareAtPrice: 159.97, // 79.99 + 29.99 + 49.99 approx
    heroImage: 'https://images.unsplash.com/photo-1511974240194-e0eb3f5022dc?q=80', // Group sleep shot
    niche: 'sleep',
    validationStatus: 'approved'
  }
]

export function getApprovedBundles(): Bundle[] {
  return bundles.filter(b => b.validationStatus === 'approved')
}

export function getBundleBySlug(slug: string): Bundle | undefined {
  return bundles.find(b => b.slug === slug)
}

export function getBundlesByProduct(productId: string): Bundle[] {
  return bundles.filter(b => b.productIds.includes(productId))
}
