'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { trackEvent } from './Analytics'

const STICKY_MESSAGES = [
  'Still searching for a fix? You\'re not alone. →',
  'Most people find it on page 1. Start here. →',
  'The right solution is closer than you think. →',
]

export default function StickyCTA() {
  const [visible, setVisible] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Rotate message every 6 seconds when visible
  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => {
      setMsgIndex((prev: number) => (prev + 1) % STICKY_MESSAGES.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [visible])

  return (
    <div
      className={`sticky-cta ${visible ? 'visible' : ''}`}
      role="complementary"
      aria-label="Find your solution"
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
              transition: 'opacity 0.4s ease',
            }}
          >
            {STICKY_MESSAGES[msgIndex]}
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Every product here passed a 3-layer validation before you saw it.
          </p>
        </div>
        <Link
          href="/problems"
          id="sticky-cta-btn"
          className="btn btn-primary"
          onClick={() => trackEvent('sticky_cta_click')}
        >
          Find My Fix →
        </Link>
      </div>
    </div>
  )
}
