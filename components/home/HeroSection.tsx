'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { trackEvent } from '@/components/layout/Analytics'

export default function HeroSection() {
  const heroRef = useRef<HTMLElement>(null)

  // Scroll reveal on mount
  useEffect(() => {
    const elements = heroRef.current?.querySelectorAll('.reveal')
    elements?.forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 120)
    })
  }, [])

  return (
    <section className="hero" ref={heroRef} id="hero" style={{ padding: 'var(--space-12) 0 var(--space-16)' }}>
      <div className="hero-bg" aria-hidden="true" />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 800 }}>

          {/* Core Identity Statement */}
          <div className="reveal delay-100" style={{ marginBottom: 'var(--space-6)' }}>
            <span style={{ 
              display: 'inline-block',
              padding: '4px 12px', 
              background: 'var(--color-bg-secondary)', 
              border: '1px solid var(--color-border)', 
              borderRadius: '99px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-4)'
            }}>
              Vexsen Curation
            </span>
            <h1 style={{ 
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', 
              fontWeight: 800,
              lineHeight: 1.05,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.03em',
              marginBottom: 'var(--space-4)'
            }}>
              We test 100 products. <br/>
              <span style={{ color: 'var(--color-accent)' }}>You only buy the 1<br/>that actually works.</span>
            </h1>
          </div>

          <p className="hero-subline reveal delay-200" style={{
            fontSize: 'clamp(1.125rem, 3vw, 1.25rem)',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            maxWidth: 600,
            marginBottom: 'var(--space-8)'
          }}>
            The internet is flooded with cheap, garbage products. We sift through the trash to curate and verify elite solutions for everyday frustrations. Precision-tested. No gimmicks.
          </p>

          <div className="reveal delay-300" style={{ 
            display: 'flex', 
            gap: 'var(--space-4)', 
            flexWrap: 'wrap',
            alignItems: 'center' 
          }}>
            <Link
              href="/collections"
              id="hero-cta-primary"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', maxWidth: '320px', textAlign: 'center' }}
              onClick={() => trackEvent('hero_cta_click', { position: 'primary' })}
            >
              Shop the Collection →
            </Link>
          </div>

          {/* High-visibility Trust Signals (Mobile-friendly Grid) */}
          <div
            className="reveal delay-400"
            style={{
              marginTop: 'var(--space-12)',
              paddingTop: 'var(--space-6)',
              borderTop: '1px solid var(--color-border)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--space-4)',
              width: '100%'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>🔒</span>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Secure Checkout</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>📦</span>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Ships in 24-72 hrs</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>🛡️</span>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>30-Day Guarantee</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>✅</span>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Verified Curation</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
