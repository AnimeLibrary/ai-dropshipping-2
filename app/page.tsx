import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { getLandingMedia } from '@/lib/landing-media'
import LandingPageClient from '@/components/home/LandingPageClient'
import { SchemaMarkup } from '@/lib/seo/schema'
import { siteConfig } from '@/lib/config/site'

export const metadata: Metadata = {
  title: 'Vexsen® Official Store — Waterproof Lip Stains & Juicy Lip Oils',
  description:
    'Shop the official Vexsen store. Discover viral 24H waterproof peel-off lip stains, hydrating juicy lip oils, and transfer-proof beauty care. Fast insured shipping & 30-day risk-free guarantee.',
  keywords: [
    'vexsen',
    'vexsen store',
    'peel off lip stain',
    'waterproof lip stain',
    'juicy lip oil',
    'transfer proof lip tint',
    'phofay lip tint',
    'korean lip stain',
    'long lasting lip stain',
  ],
  alternates: {
    canonical: 'https://vexsen.com',
  },
  openGraph: {
    type: 'website',
    url: 'https://vexsen.com',
    title: 'Vexsen® Official Store — Waterproof Lip Stains & Juicy Lip Oils',
    description:
      'Shop the official Vexsen store. Viral 24H waterproof peel-off lip stains and hydrating juicy lip oils. Insured shipping & 30-day risk-free guarantee.',
    siteName: 'Vexsen® Official Store',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vexsen® Official Store — Waterproof Lip Stains & Juicy Lip Oils',
    description: 'Viral 24H waterproof peel-off lip stains and hydrating juicy lip oils.',
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

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: 'Vexsen® Official Store',
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/collections?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <SchemaMarkup schema={websiteSchema} />
      <LandingPageClient
        initialMedia={landingMedia}
        trendingProducts={trendingProducts}
      />
    </>
  )
}
