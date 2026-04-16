'use client'

import { useState } from 'react'

interface ProductGalleryProps {
  images: string[]
  title: string
}

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-4)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/placeholder.png" alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )
  }

  const mainImage = images[currentIndex] || images[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Main Image */}
      <div style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mainImage} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s ease-in-out' }} />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-2)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: 60,
                height: 60,
                flexShrink: 0,
                padding: 0,
                background: 'var(--color-bg-secondary)',
                border: currentIndex === idx ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                cursor: 'pointer',
                opacity: currentIndex === idx ? 1 : 0.6,
                transition: 'all 0.2s ease'
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`${title} thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
