'use client'

import React, { useState } from 'react'
import type { LandingMediaConfig } from '@/lib/landing-media'
import HeroSection from '@/components/home/HeroSection'
import VideoShowcase from '@/components/home/VideoShowcase'
import LandingMediaGallery from '@/components/home/LandingMediaGallery'
import TrendingProducts from '@/components/home/TrendingProducts'
import EmailCapture from '@/components/home/EmailCapture'
import QuickEditLanding from '@/components/home/QuickEditLanding'

interface LandingPageClientProps {
  initialMedia: LandingMediaConfig
  trendingProducts: any[]
}

export default function LandingPageClient({
  initialMedia,
  trendingProducts,
}: LandingPageClientProps) {
  const [mediaConfig, setMediaConfig] = useState<LandingMediaConfig>(initialMedia)
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<'hero' | 'videoShowcase' | 'gallery'>('hero')

  const openQuickEdit = (section: 'hero' | 'videoShowcase' | 'gallery') => {
    setActiveSection(section)
    setIsQuickEditOpen(true)
  }

  return (
    <>
      {/* 1. HERO - with dynamic media (custom image / mp4 / embed) */}
      <HeroSection
        featuredProducts={trendingProducts.slice(0, 3)}
        heroConfig={mediaConfig.hero}
        onEdit={() => openQuickEdit('hero')}
        isEditing={isQuickEditOpen && activeSection === 'hero'}
      />

      {/* 2. VIDEO DEMO SHOWCASE - viral waterproof demonstration */}
      <VideoShowcase
        config={mediaConfig.videoShowcase}
        onEdit={() => openQuickEdit('videoShowcase')}
        isEditing={isQuickEditOpen && activeSection === 'videoShowcase'}
      />

      {/* 3. PRODUCTS - verified drop catalog */}
      <section className="section" id="trending-products">
        <div className="container">
          <TrendingProducts products={trendingProducts} />
        </div>
      </section>

      {/* 4. VISUAL PROOF & GALLERY - before/after & wear test pictures */}
      <LandingMediaGallery
        config={mediaConfig.gallery}
        onEdit={() => openQuickEdit('gallery')}
        isEditing={isQuickEditOpen && activeSection === 'gallery'}
      />

      {/* 5. EMAIL CAPTURE */}
      <div className="divider" style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }} />
      <section className="section-sm" id="email-capture">
        <div className="container">
          <EmailCapture />
        </div>
      </section>

      {/* QUICK EDIT FLOATING LAUNCHER & DRAWER */}
      <QuickEditLanding
        config={mediaConfig}
        onChange={setMediaConfig}
        isOpen={isQuickEditOpen}
        onToggle={() => setIsQuickEditOpen((prev) => !prev)}
        activeSection={activeSection}
        setActiveSection={(sec) => setActiveSection(sec as any)}
      />
    </>
  )
}
