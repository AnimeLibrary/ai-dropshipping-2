import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import TrendingProducts from '@/components/home/TrendingProducts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Validated Solutions | Vexsen',
  description: 'The 9% of products that passed our human and data validation.',
}

export default async function SolutionsPage() {
  const rawProducts = await prisma.product.findMany({
    where: { validationStatus: 'approved' },
    orderBy: { trendScore: 'desc' },
    select: {
      id: true, slug: true, title: true, niche: true,
      price: true, compareAtPrice: true, heroImage: true,
      shortDescription: true, trendScore: true, validationStatus: true,
    }
  })

  const products = rawProducts.map(p => ({
    ...p,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : Number(p.price) * 1.5,
    heroImage: p.heroImage || '/placeholder.png',
  }))

  return (
    <>
      <div
        style={{
          background: 'var(--color-bg-secondary)',
          padding: 'var(--space-20) 0 var(--space-12)',
          borderBottom: '1px solid var(--color-border)',
          textAlign: 'center'
        }}
      >
        <div className="container" style={{ maxWidth: 800 }}>
          <span className="badge badge-accent" style={{ marginBottom: 'var(--space-4)' }}>
            ✓ 100% Validated
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 800,
              color: 'var(--color-text-primary)',
              lineHeight: 1.1,
              marginBottom: 'var(--space-4)',
              letterSpacing: '-0.03em'
            }}
          >
            All Validated <span className="gradient-text">Solutions</span>
          </h1>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', maxWidth: 640, margin: '0 auto' }}>
            We analyzed hundreds of trending products this week. Only these made the cut.
            Every product has proven ad performance and human approval.
          </p>
        </div>
      </div>

      <div style={{ padding: 'var(--space-16) 0' }}>
        <div className="container">
          <TrendingProducts products={products} />
        </div>
      </div>
    </>
  )
}
