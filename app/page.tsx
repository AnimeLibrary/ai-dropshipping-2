import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { getRisingClusters } from '@/lib/data/keywords'
import HeroSection from '@/components/home/HeroSection'
import TrendingProducts from '@/components/home/TrendingProducts'
import SocialProof from '@/components/home/SocialProof'
import ProblemCategories from '@/components/home/ProblemCategories'
import PainBanner from '@/components/home/PainBanner'
import EmailCapture from '@/components/home/EmailCapture'
import GuidePreview from '@/components/home/GuidePreview'
import ReferralBanner from '@/components/home/ReferralBanner'

export const metadata: Metadata = {
  title: 'Vexsen — Engineered for Everyday Life',
  description:
    'Vexsen curates and engineers premium solutions to elevate your daily routines. Functional design, uncompromising quality.',
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const approvedProducts = await prisma.product.findMany({
    where: { validationStatus: 'approved' },
    orderBy: { trendScore: 'desc' },
    take: 9,
    select: {
      id: true, slug: true, title: true, niche: true, price: true,
      compareAtPrice: true, heroImage: true, trendScore: true,
    }
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

  // Max 3 guides for the preview strip
  const risingGuides = getRisingClusters().slice(0, 3)

  return (
    <>
      {/* 1. HERO — sharp, visual, one CTA */}
      <HeroSection />

      {/* 2. PRODUCTS — immediately after hero, first thing to buy */}
      <section className="section" id="trending-products">
        <div className="container">
          <TrendingProducts products={trendingProducts as any} />
        </div>
      </section>

      {/* 3. SOCIAL PROOF — TEMPORARILY DISABLED until real UGC is acquired
      <div className="divider" style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }} />
      <section className="section-sm" id="social-proof">
        <div className="container">
          < सोशलProof />
        </div>
      </section>
      */}

      {/* 4. SHOP BY PROBLEM — links to filtered product collections */}
      <div className="divider" style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }} />
      <section className="section-sm" id="problem-categories">
        <div className="container">
          <ProblemCategories />
        </div>
      </section>

      {/* 5. THE FILTER — 3 icons, minimal text, zero word bloat */}
      <section className="section-sm" id="trust-filter">
        <div className="container">
          <PainBanner />
        </div>
      </section>

      {/* 6. EMAIL CAPTURE — free money, "Get new picks before they sell out" */}
      <div className="divider" style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }} />
      <section className="section-sm" id="email-capture">
        <div className="container">
          <EmailCapture />
        </div>
      </section>

      {/* 7. RISING GUIDES — SEO bait, max 3 cards */}
      <div className="divider" style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }} />
      <section className="section-sm" id="guides-preview">
        <div className="container">
          <GuidePreview clusters={risingGuides} />
        </div>
      </section>

      {/* 8. REFERRAL + FOOTER CLOSE — bottom, where it belongs */}
      <ReferralBanner />

      {/* FAQ removed from homepage — lives at /faq to avoid killing buy momentum */}
    </>
  )
}
