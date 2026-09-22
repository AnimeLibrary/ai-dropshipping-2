import { prisma } from '@/lib/db/prisma'

export interface HeroMediaConfig {
  type: 'product' | 'image' | 'video' | 'embed'
  imageUrl?: string
  videoUrl?: string
  posterUrl?: string
  videoAutoplay?: boolean
  videoLoop?: boolean
  videoMuted?: boolean
  kicker?: string
  title?: string
  subtitle?: string
  badgeText?: string
  primaryCtaText?: string
  primaryCtaLink?: string
}

export interface VideoShowcaseConfig {
  enabled: boolean
  title: string
  subtitle: string
  videoType: 'direct' | 'youtube' | 'vimeo'
  videoUrl: string
  posterUrl?: string
  aspectRatio: '16:9' | '9:16'
  badgeText?: string
  ctaText?: string
  ctaLink?: string
  bulletPoints?: string[]
}

export interface MediaCardItem {
  id: string
  type: 'image' | 'video'
  url: string
  posterUrl?: string
  tag?: string
  title: string
  caption: string
}

export interface MediaGalleryConfig {
  enabled: boolean
  title: string
  subtitle: string
  items: MediaCardItem[]
}

export interface LandingMediaConfig {
  hero: HeroMediaConfig
  videoShowcase: VideoShowcaseConfig
  gallery: MediaGalleryConfig
}

export const DEFAULT_LANDING_MEDIA: LandingMediaConfig = {
  hero: {
    type: 'product',
    imageUrl: '',
    videoUrl: '',
    posterUrl: '',
    videoAutoplay: true,
    videoLoop: true,
    videoMuted: true,
    kicker: 'Viral 24H Waterproof Lip Stain',
    title: 'The Peel-Off Lip Stain That Stays On All Day.',
    subtitle: 'Zero smudging on cups, teeth, or clothes. Apply, let set for 5 minutes, gently peel away, and reveal flawless, waterproof color infused with squalane and Vitamin E.',
    badgeText: 'Trending Viral Drop — 14,800+ Sold',
    primaryCtaText: 'Shop Peel-Off Stain (Save 29%)',
    primaryCtaLink: '/products/peeling-lip-gloss-waterproof-lip-liner-stain--tbq7',
  },
  videoShowcase: {
    enabled: true,
    title: 'See It In Action: The 24H Waterproof Peel-Off Test',
    subtitle: 'Watch how the peel-off formula locks color deep into your lips without smudging, fading, or transferring onto glasses and clothes.',
    videoType: 'direct',
    videoUrl: '', // direct mp4 URL or youtube
    posterUrl: 'https://cf.cjdropshipping.com/quick/product/1cf4594f-2b13-4c96-ae7c-82eef0f51f0a.jpg',
    aspectRatio: '16:9',
    badgeText: '100% Transfer-Proof Demo',
    ctaText: 'Shop The Waterproof Stain',
    ctaLink: '/products/peeling-lip-gloss-waterproof-lip-liner-stain--tbq7',
    bulletPoints: [
      'Locks pigment into skin — no sticky residue',
      'Tested against water, hot drinks, and masks',
      'Enriched with hydrating Vitamin E & squalane',
    ],
  },
  gallery: {
    enabled: true,
    title: 'Real Tests & Visual Proof',
    subtitle: 'Unedited results, peel-off closeups, and real wear tests before and after application.',
    items: [
      {
        id: 'card-1',
        type: 'image',
        url: 'https://cf.cjdropshipping.com/quick/product/ae28ce99-fc07-46e9-a16f-36c4474888d8.jpg',
        tag: 'Step 1: Apply & Dry',
        title: 'Thick even application',
        caption: 'Glides on smoothly with precision applicator. Dries into a peelable film in 5 minutes.',
      },
      {
        id: 'card-2',
        type: 'image',
        url: 'https://cf.cjdropshipping.com/quick/product/46cd1f87-fedf-4fbd-adf3-9ec97d6e45d0.jpg',
        tag: 'Step 2: Peel Off',
        title: 'Gentle peel-off reveal',
        caption: 'Peels off effortlessly revealing a naturally flush, non-drying vibrant stain that lasts 24 hours.',
      },
      {
        id: 'card-3',
        type: 'image',
        url: 'https://cf.cjdropshipping.com/17242848/1826468332749197312.jpg',
        tag: 'Step 3: Juicy Finish',
        title: 'Top with Juicy Lip Oil',
        caption: 'Layer with PHOFAY hydrating oil for glass-shine mirror gloss without sacrificing staying power.',
      },
    ],
  },
}

export async function getLandingMedia(): Promise<LandingMediaConfig> {
  try {
    const record = await prisma.siteSetting.findUnique({
      where: { key: 'landing_media' },
    })

    if (!record || !record.value) {
      return DEFAULT_LANDING_MEDIA
    }

    const val = record.value as unknown as Partial<LandingMediaConfig>

    return {
      hero: {
        ...DEFAULT_LANDING_MEDIA.hero,
        ...(val.hero || {}),
      },
      videoShowcase: {
        ...DEFAULT_LANDING_MEDIA.videoShowcase,
        ...(val.videoShowcase || {}),
      },
      gallery: {
        ...DEFAULT_LANDING_MEDIA.gallery,
        ...(val.gallery || {}),
        items: Array.isArray(val.gallery?.items) && val.gallery.items.length > 0
          ? val.gallery.items
          : DEFAULT_LANDING_MEDIA.gallery.items,
      },
    }
  } catch (error) {
    console.error('[landing-media] failed to load from DB, using defaults:', error)
    return DEFAULT_LANDING_MEDIA
  }
}

export async function saveLandingMedia(config: Partial<LandingMediaConfig>): Promise<LandingMediaConfig> {
  const current = await getLandingMedia()
  const merged: LandingMediaConfig = {
    hero: {
      ...current.hero,
      ...(config.hero || {}),
    },
    videoShowcase: {
      ...current.videoShowcase,
      ...(config.videoShowcase || {}),
    },
    gallery: {
      ...current.gallery,
      ...(config.gallery || {}),
      items: config.gallery?.items || current.gallery.items,
    },
  }

  await prisma.siteSetting.upsert({
    where: { key: 'landing_media' },
    update: { value: merged as any },
    create: { key: 'landing_media', value: merged as any },
  })

  return merged
}
