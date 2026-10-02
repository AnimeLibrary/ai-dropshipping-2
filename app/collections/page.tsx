import type { Metadata } from 'next'
import { Suspense } from 'react'
import { prisma } from '@/lib/db/prisma'
import CollectionsClient from './CollectionsClient'
import { SchemaMarkup, collectionPageSchema } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Shop All Beauty Products | Vexsen Official Store',
  description:
    'Browse every curated Vexsen product. Waterproof peel-off lip stains, hydrating juicy lip oils, and beauty essentials — verified, inspected, and insured shipping.',
  keywords: [
    'vexsen store', 'shop all beauty products', 'peel off lip stain', 'juicy lip oil',
    'waterproof lip color', 'transfer proof lip tint', 'vexsen collections',
  ],
  alternates: { canonical: '/collections' },
  openGraph: {
    type: 'website',
    url: '/collections',
    title: 'Shop All Beauty Products | Vexsen',
    description: 'Browse every curated Vexsen beauty product. Verified, inspected, and insured shipping.',
    siteName: 'Vexsen® Official Store',
  },
}

export const dynamic = 'force-dynamic'

export default async function CollectionsPage() {
  const products = await prisma.product.findMany({
    where: { validationStatus: 'approved' },
    orderBy: { trendScore: 'desc' },
    select: {
      id: true, slug: true, title: true, niche: true,
      category: true, price: true, compareAtPrice: true,
      heroImage: true, shortDescription: true, trendScore: true,
      validationStatus: true,
    }
  })

  const normalized = products.map(p => ({
    ...p,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : Number(p.price) * 1.5,
    heroImage: p.heroImage || '/placeholder.png',
  }))

  return (
    <>
      <SchemaMarkup schema={collectionPageSchema(normalized)} />
      <Suspense fallback={<div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>Loading collections...</div>}>
        <CollectionsClient products={normalized} />
      </Suspense>
    </>
  )
}
