import type { Metadata } from 'next'
import { Suspense } from 'react'
import { prisma } from '@/lib/db/prisma'
import CollectionsClient from './CollectionsClient'
import { SchemaMarkup, collectionPageSchema } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Waterproof Lip Stains & Juicy Lip Oils for Sale | Vexsen®',
  description:
    'Shop waterproof peel-off lip stains, 24-hour transfer-proof lip tints, and hydrating juicy lip oils for sale online. Smudge-proof beauty essentials with insured express delivery.',
  keywords: [
    'lip stain for sale',
    'lipstain for sell',
    'waterproof lip stain for sale',
    'peel off lip stain for sale',
    'buy lip stain online',
    'long lasting lip tint for sale',
    'juicy lip oil on sale',
    'transfer proof lip stain',
    'vexsen store',
    'vexsen beauty',
  ],
  alternates: { canonical: '/collections' },
  openGraph: {
    type: 'website',
    url: '/collections',
    title: 'Waterproof Lip Stains & Juicy Lip Oils for Sale | Vexsen®',
    description:
      'Shop waterproof peel-off lip stains, 24h transfer-proof lip tints, and hydrating juicy lip oils on sale. Verified, smudge-proof beauty essentials.',
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
