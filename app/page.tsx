import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { getRisingClusters } from '@/lib/data/keywords' // Kept static until SEO clusters are populated in DB
import HeroSection from '@/components/home/HeroSection'
import PainBanner from '@/components/home/PainBanner'
import TrendingProducts from '@/components/home/TrendingProducts'
import ProblemCategories from '@/components/home/ProblemCategories'
import SocialProof from '@/components/home/SocialProof'
import FaqSection from '@/components/home/FaqSection'
import GuidePreview from '@/components/home/GuidePreview'

export const metadata: Metadata = {
  title: 'Vexsen — Engineered for Everyday Life',
  description:
    'Vexsen curates and engineers premium solutions to elevate your daily routines. Functional design, uncompromising quality.',
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Read ONLY approved products from the real database
  const approvedProducts = await prisma.product.findMany({
    where: { validationStatus: 'approved' },
    orderBy: { trendScore: 'desc' },
    take: 6,
    select: {
      id: true, slug: true, title: true, niche: true, price: true,
      compareAtPrice: true, heroImage: true, trendScore: true,
    }
  })

  // Format to match expected component props
  const trendingProducts = approvedProducts.map(p => ({
    ...p,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : p.price * 1.5,
    heroImage: p.heroImage || '/placeholder.png'
  }))

  const risingGuides = getRisingClusters().slice(0, 4)

  return (
    <>
      <HeroSection />
      
      {/* Brand Identity / Trust Block */}
      <section className="section-sm" style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 600 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-3)', letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
            Why Vexsen?
          </h2>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            We believe that everyday frustrations deserve permanent solutions. Vexsen engineers and curates products with uncompromising quality to elevate your daily routines.
          </p>
        </div>
      </section>

      <section className="section-sm" id="trust-filter"><div className="container"><PainBanner /></div></section>
      <section className="section" id="trending-products"><div className="container"><TrendingProducts products={trendingProducts as any} /></div></section>
      <div className="divider" style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }} />
      <section className="section-sm" id="problem-categories"><div className="container"><ProblemCategories /></div></section>
      <div className="divider" style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }} />
      <section className="section-sm" id="social-proof"><div className="container"><SocialProof /></div></section>
      <div className="divider" style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }} />
      <section className="section-sm" id="guides-preview"><div className="container"><GuidePreview clusters={risingGuides} /></div></section>
      <div className="divider" style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }} />
      <section className="section-sm" id="faq"><div className="container"><FaqSection /></div></section>
    </>
  )
}
