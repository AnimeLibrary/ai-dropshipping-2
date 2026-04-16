import type { Metadata } from 'next'
import { Suspense } from 'react'
import { prisma } from '@/lib/db/prisma'
import CollectionsClient from './CollectionsClient'

export const metadata: Metadata = {
  title: 'Shop All Products | Vexsen',
  description:
    'Browse every curated product in the Vexsen catalog. Filtered by niche, sorted by trending. Every item is verified before it ships.',
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
    <Suspense fallback={<div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>Loading collections...</div>}>
      <CollectionsClient products={normalized} />
    </Suspense>
  )
}
