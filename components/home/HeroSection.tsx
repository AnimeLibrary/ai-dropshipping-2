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
    <section className="hero" ref={heroRef} id="hero">
      {/* Ambient background */}
      <div className="hero-bg" aria-hidden="true" />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 740 }}>

          {/* Overline */}
          <div className="hero-overline reveal">
            AI-Validated · Data-Driven · Problem-First
          </div>

          {/* Headline — pain first */}
          <h1 className="hero-headline reveal delay-100">
            Stop Buying Things<br />
            That <span className="gradient-text">Don't Work</span>
          </h1>

          {/* Subline — empathy + solution */}
          <p className="hero-subline reveal delay-200">
            Most products promise results. Few deliver them. TrendDrop uses real ad performance data,
            buyer behavior, and AI analysis to surface only the products that actually solve the problem
            you searched for.
          </p>

          {/* CTA Group */}
          <div className="hero-cta-group reveal delay-300">
            <Link
              href="/collections"
              id="hero-cta-primary"
              className="btn btn-primary btn-lg"
              onClick={() => trackEvent('hero_cta_click', { position: 'primary' })}
            >
              Browse Trending Products
            </Link>
            <Link
              href="/guides"
              id="hero-cta-secondary"
              className="btn btn-secondary btn-lg"
              onClick={() => trackEvent('hero_cta_click', { position: 'secondary' })}
            >
              Read the Guides →
            </Link>
          </div>

          {/* Trust bar */}
          <div
            className="reveal delay-400"
            style={{
              marginTop: 'var(--space-10)',
              display: 'flex',
              gap: 'var(--space-6)',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {[
              { label: 'Products Analyzed', value: '12,000+' },
              { label: 'Data Sources', value: 'Kalodata + Minea' },
              { label: 'Avg. Trend Score', value: '80+ / 100' },
            ].map((stat) => (
              <div key={stat.label}>
                <p
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-xl)',
                    fontWeight: 800,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {stat.value}
                </p>
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
