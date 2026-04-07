'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { trackEvent } from './Analytics'

export default function StickyCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`sticky-cta ${visible ? 'visible' : ''}`}
      role="complementary"
      aria-label="Shop CTA"
    >
      <div
        className="container flex-between"
        style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}
      >
        <div>
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-primary)',
            }}
          >
            Ready to solve the problem?
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Browse trending products — curated by AI, validated by data.
          </p>
        </div>
        <Link
          href="/collections"
          id="sticky-cta-btn"
          className="btn btn-primary"
          onClick={() => trackEvent('sticky_cta_click')}
        >
          Browse Collections →
        </Link>
      </div>
    </div>
  )
}
