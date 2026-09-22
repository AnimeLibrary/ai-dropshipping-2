'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { trackEvent } from '@/components/layout/Analytics'
import type { HeroMediaConfig } from '@/lib/landing-media'

interface FeaturedProduct {
  slug: string
  title: string
  price: number
  heroImage?: string | null
}

interface HeroSectionProps {
  featuredProducts?: FeaturedProduct[]
  heroConfig?: HeroMediaConfig
  onEdit?: () => void
  isEditing?: boolean
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

function parseVideoEmbed(url?: string) {
  if (!url) return null
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = ''
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0] || ''
    } else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split(/[&#]/)[0] || ''
    } else if (url.includes('/embed/')) {
      videoId = url.split('/embed/')[1]?.split(/[?#]/)[0] || ''
    }
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0` : null
  }
  if (url.includes('vimeo.com')) {
    const parts = url.split('/')
    const id = parts[parts.length - 1]?.split(/[?#]/)[0]
    return id ? `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1` : null
  }
  return null
}

export default function HeroSection({
  featuredProducts = [],
  heroConfig,
  onEdit,
  isEditing,
}: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null)
  const featured = featuredProducts[0]
  const productImg = firstImage(featured?.heroImage)
  const featuredHref = featured ? `/products/${featured.slug}` : '/collections'

  useEffect(() => {
    const elements = heroRef.current?.querySelectorAll('.reveal')
    elements?.forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 90)
    })
  }, [])

  const mediaType = heroConfig?.type || 'product'
  const customImg = heroConfig?.imageUrl
  const customVideo = heroConfig?.videoUrl
  const customPoster = heroConfig?.posterUrl || productImg || undefined
  const embedUrl = parseVideoEmbed(customVideo)

  const displayImage = mediaType === 'image' && customImg ? customImg : productImg
  const isDirectVideo = (mediaType === 'video' || (!embedUrl && customVideo)) && !!customVideo
  const isEmbedVideo = (mediaType === 'embed' || !!embedUrl) && !!embedUrl

  const kickerText = heroConfig?.kicker || 'Verified everyday upgrades'
  const titleText = heroConfig?.title || 'Buy the product that already passed the test.'
  const sublineText =
    heroConfig?.subtitle ||
    'Vexsen filters trend hype, supplier risk, bad pricing, and weak product pages before anything reaches checkout. Less scrolling. Better picks. Cleaner buying.'
  const primaryCtaText = heroConfig?.primaryCtaText || 'Shop Verified Picks'
  const primaryCtaLink = heroConfig?.primaryCtaLink || '/collections'
  const consoleBadge = heroConfig?.badgeText || 'Live curation console'

  return (
    <section className="hero hero-future" ref={heroRef} id="hero" style={{ position: 'relative' }}>
      <div className="hero-bg" aria-hidden="true" />

      {/* Quick Edit Overlay Button */}
      {onEdit && (
        <button
          onClick={onEdit}
          type="button"
          aria-label="Edit Hero Media"
          style={{
            position: 'absolute',
            top: '20px',
            right: '24px',
            zIndex: 35,
            background: isEditing ? '#7c3aed' : 'rgba(24, 24, 36, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            border: '1px solid rgba(124, 58, 237, 0.4)',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s ease',
          }}
        >
          <span>📸</span>
          <span>Quick Edit Hero</span>
        </button>
      )}

      <div className="container hero-layout">
        <div className="hero-copy">
          <div className="reveal delay-100">
            <span className="hero-kicker">{kickerText}</span>
            <h1 className="hero-title">{titleText}</h1>
          </div>

          <p className="hero-subline reveal delay-200">{sublineText}</p>

          <div className="hero-cta-group reveal delay-300">
            <Link
              href={primaryCtaLink}
              id="hero-cta-primary"
              className="btn btn-primary btn-lg"
              onClick={() => trackEvent('hero_cta_click', { position: 'primary' })}
            >
              {primaryCtaText}
            </Link>
            <Link
              href="#video-showcase"
              className="btn btn-secondary btn-lg"
              onClick={() => trackEvent('hero_cta_click', { position: 'video_showcase' })}
            >
              Watch Video Demo
            </Link>
          </div>

          <div className="hero-proof-row reveal delay-400" aria-label="Store trust summary">
            {[
              ['14,800+', 'Happy customers'],
              ['24 Hours', 'Waterproof wear'],
              ['30 Days', 'Risk-free guarantee'],
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
            <span>{consoleBadge}</span>
            <strong>{featuredProducts.length || 1} active drop{featuredProducts.length === 1 ? '' : 's'}</strong>
          </div>

          <Link href={featuredHref} className="hero-product-visual" id="hero-featured-product">
            <div className="hero-product-media" style={{ position: 'relative' }}>
              {isEmbedVideo ? (
                <iframe
                  src={embedUrl!}
                  title="Hero Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 0, pointerEvents: 'none' }}
                />
              ) : isDirectVideo ? (
                <video
                  src={customVideo}
                  poster={customPoster}
                  autoPlay={heroConfig?.videoAutoplay ?? true}
                  loop={heroConfig?.videoLoop ?? true}
                  muted={heroConfig?.videoMuted ?? true}
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : displayImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayImage} alt={featured?.title || 'Featured Vexsen product'} />
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
              ['24H Transfer-Proof', 'Zero smudge on cups, teeth & clothes'],
              ['Gentle Peel-Off', 'Clean effortless reveal in 5 mins'],
              ['Hydrating Formula', 'Squalane & Vitamin E lip nourishment'],
              ['Insured Shipping', 'Tracked 7–12 business day delivery'],
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
