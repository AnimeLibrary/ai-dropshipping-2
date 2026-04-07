'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { trackEvent } from '@/components/layout/Analytics'

// Pain hook states — ordered by top-performing category.
// Back pain leads because it has the highest trend score + conversion signal.
// When real analytics are wired in, replace this order dynamically via topPerformingCategory.
const PAIN_HOOKS = [
  {
    niche: 'back-pain',
    line1: 'Your lower back is quietly breaking down.',
    line2: '8 hours a day. 5 days a week.',
    line3: "Here's what's actually fixing it.",
    sub: "You've adjusted your chair a hundred times. It still hurts. That's not a willpower problem — it's a design problem. We found what fixes the root cause.",
    cta: 'Fix Back Pain →',
    href: '/problems/back-pain',
  },
  {
    niche: 'sleep',
    line1: "It's 2am. You're exhausted but can't sleep.",
    line2: 'Your nervous system is stuck in overdrive.',
    line3: "Here's what actually calms it.",
    sub: "Melatonin. Phone-free nights. Blue light glasses. You've tried everything. The problem isn't your habits — it's your nervous system. There's a biological fix.",
    cta: 'Fix Sleep Problems →',
    href: '/problems/sleep',
  },
  {
    niche: 'pet-care',
    line1: 'Pet hair is on everything you own.',
    line2: "Lint rollers are eating your money.",
    line3: "Here's what actually works.",
    sub: "You love your pet. You hate the tax. Three lint rolls to get one cushion clean — and it's back tomorrow. One product changed this for thousands of pet owners.",
    cta: 'Fix Pet Hair →',
    href: '/problems/pet-care',
  },
]

const TRUST_STATS = [
  { label: 'People fixed their problem this month', value: '4,200+' },
  { label: 'Products rejected before you see them', value: '91%' },
  { label: 'Avg. days to first result', value: '< 7' },
]

export default function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [fading, setFading] = useState(false)
  const heroRef = useRef<HTMLElement>(null)

  // Scroll reveal on mount
  useEffect(() => {
    const elements = heroRef.current?.querySelectorAll('.reveal')
    elements?.forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 120)
    })
  }, [])

  // Auto-rotate pain hooks every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % PAIN_HOOKS.length)
        setFading(false)
      }, 300)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const hook = PAIN_HOOKS[activeIndex]

  return (
    <section className="hero" ref={heroRef} id="hero">
      <div className="hero-bg" aria-hidden="true" />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 760 }}>

          {/* Niche indicator dots */}
          <div
            className="reveal"
            style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', alignItems: 'center' }}
          >
            {PAIN_HOOKS.map((h, i) => (
              <button
                key={h.niche}
                id={`hero-dot-${h.niche}`}
                onClick={() => {
                  setFading(true)
                  setTimeout(() => { setActiveIndex(i); setFading(false) }, 300)
                }}
                aria-label={`View ${h.niche.replace(/-/g, ' ')} solutions`}
                style={{
                  width: i === activeIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 999,
                  background: i === activeIndex ? 'var(--color-accent)' : 'var(--color-border)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: 0,
                }}
              />
            ))}
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {hook.niche.replace(/-/g, ' ')}
            </span>
          </div>

          {/* Rotating pain headline */}
          <div
            style={{
              opacity: fading ? 0 : 1,
              transform: fading ? 'translateY(-6px)' : 'translateY(0)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
              marginBottom: 'var(--space-6)',
            }}
          >
            <h1 className="hero-headline reveal delay-100" style={{ marginBottom: 'var(--space-2)' }}>
              {hook.line1}
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-1)',
              }}
            >
              {hook.line2}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
                fontWeight: 700,
                color: 'var(--color-accent)',
              }}
            >
              {hook.line3}
            </p>
          </div>

          {/* Empathy sub-line */}
          <p
            className="hero-subline reveal delay-200"
            style={{
              opacity: fading ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
          >
            {hook.sub}
          </p>

          {/* CTAs */}
          <div className="hero-cta-group reveal delay-300">
            <Link
              href={hook.href}
              id="hero-cta-primary"
              className="btn btn-primary btn-lg"
              onClick={() => trackEvent('hero_cta_click', { niche: hook.niche, position: 'primary' })}
            >
              {hook.cta}
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

          {/* Human outcome trust bar */}
          <div
            className="reveal delay-400"
            style={{
              marginTop: 'var(--space-10)',
              display: 'flex',
              gap: 'var(--space-8)',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {TRUST_STATS.map((stat) => (
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
                    maxWidth: 140,
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
