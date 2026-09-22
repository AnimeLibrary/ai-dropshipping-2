import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import HeroSection from '@/components/home/HeroSection'
import TrendingProducts from '@/components/home/TrendingProducts'
import EmailCapture from '@/components/home/EmailCapture'

export const metadata: Metadata = {
  title: 'Vexsen - Curated High-Performance Solutions',
  description:
    'Vexsen curates proven, high-performance ergonomic and lifestyle solutions engineered for daily life. Fast shipping, 30-day risk-free guarantee.',
  alternates: {
    canonical: '/',
  },
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const approvedProducts = await prisma.product.findMany({
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
  })

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
    <>
      {/* 1. HERO - sharp, visual, one CTA */}
      <HeroSection featuredProducts={trendingProducts.slice(0, 3)} />

      {/* 2. PRODUCTS - first thing to buy */}
      <section className="section" id="trending-products">
        <div className="container">
          <TrendingProducts products={trendingProducts as any} />
        </div>
      </section>

      {/* 4. EMAIL CAPTURE - 10% off for subscriber list */}
      <div className="divider" style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }} />
      <section className="section-sm" id="email-capture">
        <div className="container">
          <EmailCapture />
        </div>
      </section>
    </>
  )
}
