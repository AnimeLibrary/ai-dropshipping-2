import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { getLandingMedia } from '@/lib/landing-media'
import LandingPageClient from '@/components/home/LandingPageClient'

export const metadata: Metadata = {
  title: 'Vexsen® Official Store — Waterproof Lip Stains & Juicy Lip Oils',
  description:
    'Shop the official Vexsen store. Discover viral 24H waterproof peel-off lip stains, hydrating juicy lip oils, and transfer-proof beauty care. Fast insured shipping & 30-day risk-free guarantee.',
  alternates: {
    canonical: 'https://vexsen.com',
  },
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [approvedProducts, landingMedia] = await Promise.all([
    prisma.product.findMany({
      where: { validationStatus: 'approved' },
      orderBy: { trendScore: 'desc' },
      take: 12,
      select: {
        id: true, slug: true, title: true, niche: true, price: true,
        compareAtPrice: true, heroImage: true, trendScore: true,
      }
    }).catch((error) => {
      console.error('[home] products unavailable', error)
      return []
    }),
    getLandingMedia(),
  ])

  const trendingProducts = (approvedProducts || []).map(p => {
    const price = Number(p.price || 0)
    const compareAtPrice = p.compareAtPrice ? Number(p.compareAtPrice) : price * 1.5
    return {
      ...p, price, compareAtPrice,
      niche: p.niche || 'general',
      title: p.title || 'Product',
      heroImage: p.heroImage || '/placeholder.png'
    }
  })

  return (
    <LandingPageClient
      initialMedia={landingMedia}
      trendingProducts={trendingProducts}
    />
  )
}
