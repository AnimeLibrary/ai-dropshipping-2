import type { Metadata } from 'next'
import Link from 'next/link'
import { getTrendingProducts } from '@/lib/data/products'
import { getRisingClusters } from '@/lib/data/keywords'
import HeroSection from '@/components/home/HeroSection'
import PainBanner from '@/components/home/PainBanner'
import TrendingProducts from '@/components/home/TrendingProducts'
import ProblemCategories from '@/components/home/ProblemCategories'
import SocialProof from '@/components/home/SocialProof'
import FaqSection from '@/components/home/FaqSection'
import GuidePreview from '@/components/home/GuidePreview'

export const metadata: Metadata = {
  title: 'TrendDrop — Products That Solve Real Problems',
  description:
    'Stop buying things that don\'t work. TrendDrop surfaces AI-validated trending products matched to real problems — so you get results, not clutter.',
}

export default function HomePage() {
  const trendingProducts = getTrendingProducts(6)
  const risingGuides = getRisingClusters().slice(0, 4)

  return (
    <>
      <HeroSection />

      <section className="section-sm" id="trust-filter">
        <div className="container">
          <PainBanner />
        </div>
      </section>

      <section className="section" id="trending-products">
        <div className="container">
          <TrendingProducts products={trendingProducts} />
        </div>
      </section>

      <div className="divider" style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }} />

      <section className="section-sm" id="problem-categories">
        <div className="container">
          <ProblemCategories />
        </div>
      </section>

      <div className="divider" style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }} />

      <section className="section-sm" id="social-proof">
        <div className="container">
          <SocialProof />
        </div>
      </section>

      <div className="divider" style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }} />

      <section className="section-sm" id="guides-preview">
        <div className="container">
          <GuidePreview clusters={risingGuides} />
        </div>
      </section>

      <div className="divider" style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }} />

      <section className="section-sm" id="faq">
        <div className="container">
          <FaqSection />
        </div>
      </section>
    </>
  )
}
