'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface StickyCTAProps {
  productTitle: string
  price: number
  slug: string
}

export default function StickyCTA({ productTitle, price, slug }: StickyCTAProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 800px or 30% of the page
      const scrollY = window.scrollY
      setIsVisible(scrollY > 800)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className={`sticky-cta ${isVisible ? 'visible' : ''}`}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div className="badge badge-accent" style={{ fontSize: '10px' }}>Solution Found</div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-sm)' }}>{productTitle}</p>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Starting at ${price.toFixed(2)}
            </p>
          </div>
        </div>
        
        <Link href={`/products/${slug}`} className="btn btn-primary btn-sm">
          Get Specific Relief →
        </Link>
      </div>
    </div>
  )
}
