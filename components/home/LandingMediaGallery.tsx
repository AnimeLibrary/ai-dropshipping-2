'use client'

import React from 'react'
import type { MediaGalleryConfig } from '@/lib/landing-media'

interface LandingMediaGalleryProps {
  config: MediaGalleryConfig
  onEdit?: () => void
  isEditing?: boolean
}

export default function LandingMediaGallery({ config, onEdit, isEditing }: LandingMediaGalleryProps) {
  if (!config.enabled || !config.items || config.items.length === 0) return null

  return (
    <section
      id="media-gallery"
      style={{
        padding: 'var(--space-12) 0',
        background: 'var(--color-bg)',
        position: 'relative',
      }}
    >
      {/* Quick Edit Overlay Button */}
      {onEdit && (
        <button
          onClick={onEdit}
          type="button"
          aria-label="Edit Proof Gallery"
          style={{
            position: 'absolute',
            top: '16px',
            right: '24px',
            zIndex: 30,
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
          <span>🖼️</span>
          <span>Quick Edit Pictures</span>
        </button>
      )}

      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto var(--space-10)' }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: 'var(--space-2)',
            }}
          >
            Visual Evidence
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
              fontWeight: 900,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.025em',
              marginBottom: 'var(--space-3)',
            }}
          >
            {config.title}
          </h2>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            {config.subtitle}
          </p>
        </div>

        {/* Media Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          {config.items.map((item, idx) => (
            <div
              key={item.id || idx}
              style={{
                borderRadius: 'var(--radius-lg, 16px)',
                overflow: 'hidden',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 24px -10px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {/* Media Container */}
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '4 / 3',
                  width: '100%',
                  background: '#0e0e17',
                  overflow: 'hidden',
                }}
              >
                {item.tag && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      zIndex: 10,
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(6px)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {item.tag}
                  </span>
                )}

                {item.type === 'video' ? (
                  <video
                    src={item.url}
                    poster={item.posterUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url || '/placeholder.png'}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>

              {/* Text Description */}
              <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 800,
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
