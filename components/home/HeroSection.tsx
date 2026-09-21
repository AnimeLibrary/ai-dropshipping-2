'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { trackEvent } from '@/components/layout/Analytics'

interface FeaturedProduct {
  slug: string
  title: string
  price: number
  heroImage?: string | null
}

interface HeroSectionProps {
  featuredProducts?: FeaturedProduct[]
}

function firstImage(image?: string | null): string | null {
  if (!image) return null
  try {
    if (image.startsWith('[')) {
      const parsed = JSON.parse(image)
      return Array.isArray(parsed) && parsed[0] ? parsed[0] : null
    }
  } catch {
    return null
  }
  return image
}

export default function HeroSection({ featuredProducts = [] }: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null)
  const featured = featuredProducts[0]
  const featuredImage = firstImage(featured?.heroImage)
  const featuredHref = featured ? `/products/${featured.slug}` : '/collections'

  useEffect(() => {
    const elements = heroRef.current?.querySelectorAll('.reveal')
    elements?.forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 90)
    })
  }, [])

  return (
    <section className="hero hero-future" ref={heroRef} id="hero">
      <div className="hero-bg" aria-hidden="true" />

      <div className="container hero-layout">
        <div className="hero-copy">
          <div className="reveal delay-100">
            <span className="hero-kicker">Verified everyday upgrades</span>
            <h1 className="hero-title">
              Buy the product that already passed the test.
            </h1>
          </div>

          <p className="hero-subline reveal delay-200">
            Vexsen filters trend hype, supplier risk, bad pricing, and weak product pages before anything reaches checkout. Less scrolling. Better picks. Cleaner buying.
          </p>

          <div className="hero-cta-group reveal delay-300">
            <Link
              href="/collections"
              id="hero-cta-primary"
              className="btn btn-primary btn-lg"
              onClick={() => trackEvent('hero_cta_click', { position: 'primary' })}
            >
              Shop Verified Picks
            </Link>
            <Link
              href="#trust-matrix"
              className="btn btn-secondary btn-lg"
              onClick={() => trackEvent('hero_cta_click', { position: 'trust_matrix' })}
            >
              See Buyer Protections
            </Link>
          </div>

          <div className="hero-proof-row reveal delay-400" aria-label="Store trust summary">
            {[
              ['Stripe', 'encrypted checkout'],
              ['Manual', 'approval before listing'],
              ['30 days', 'return window'],
            ].map(([value, label]) => (
              <div className="hero-proof" key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="hero-console reveal delay-300" aria-label="Featured verification console">
          <div className="hero-console-bar">
            <span>Live curation console</span>
            <strong>{featuredProducts.length || 1} active drop{featuredProducts.length === 1 ? '' : 's'}</strong>
          </div>

          <Link href={featuredHref} className="hero-product-visual" id="hero-featured-product">
            <div className="hero-product-media">
              {featuredImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featuredImage} alt={featured?.title || 'Featured Vexsen product'} />
              ) : (
                <div className="hero-product-placeholder" style={{ background: '#111118', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="48" height="48" viewBox="0 0 512 512" fill="none">
                    <path
                      d="M120 130 L220 130 L256 260 L292 130 L392 130 L296 382 C280 422 232 422 216 382 Z"
                      fill="url(#heroVexGrad)"
                    />
                    <path d="M256 310 L280 180 L232 180 Z" fill="#0b0b10" opacity="0.9" />
                    <defs>
                      <linearGradient id="heroVexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="50%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#f43f5e" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              )}
            </div>
            <div className="hero-product-copy">
              <span>Featured verified drop</span>
              <h2>{featured?.title || 'Curated products are syncing'}</h2>
              <p>{featured ? `$${featured.price.toFixed(2)}` : 'New approved picks appear here first.'}</p>
            </div>
          </Link>

          <div className="hero-verification-grid">
            {[
              ['Price locked', 'Server-side checkout pricing'],
              ['Risk screened', 'No public admin data leaks'],
              ['Policy visible', 'Shipping, refunds, support'],
              ['Search ready', 'Canonical URLs and sitemap'],
            ].map(([title, detail]) => (
              <div className="hero-verification-item" key={title}>
                <span aria-hidden="true" />
                <div>
                  <strong>{title}</strong>
                  <p>{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}
