'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import type { VideoShowcaseConfig } from '@/lib/landing-media'

interface VideoShowcaseProps {
  config: VideoShowcaseConfig
  onEdit?: () => void
  isEditing?: boolean
}

function parseVideoUrl(url: string, type: 'direct' | 'youtube' | 'vimeo') {
  if (!url) return { embedUrl: null, isEmbed: false }

  if (type === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = ''
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0] || ''
    } else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split(/[&#]/)[0] || ''
    } else if (url.includes('/embed/')) {
      videoId = url.split('/embed/')[1]?.split(/[?#]/)[0] || ''
    }
    return {
      embedUrl: videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1` : null,
      isEmbed: true,
    }
  }

  if (type === 'vimeo' || url.includes('vimeo.com')) {
    const parts = url.split('/')
    const id = parts[parts.length - 1]?.split(/[?#]/)[0]
    return {
      embedUrl: id ? `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1` : null,
      isEmbed: true,
    }
  }

  return { embedUrl: url, isEmbed: false }
}

export default function VideoShowcase({ config, onEdit, isEditing }: VideoShowcaseProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  if (!config.enabled) return null

  const { embedUrl, isEmbed } = parseVideoUrl(config.videoUrl, config.videoType)
  const isVertical = config.aspectRatio === '9:16'

  return (
    <section
      id="video-showcase"
      style={{
        padding: 'var(--space-12) 0',
        background: 'linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-secondary) 100%)',
        position: 'relative',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Quick Edit Overlay Button */}
      {onEdit && (
        <button
          onClick={onEdit}
          type="button"
          aria-label="Edit Video Showcase"
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
          <span>🎬</span>
          <span>Quick Edit Video</span>
        </button>
      )}

      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isVertical ? 'minmax(280px, 360px) 1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-8)',
            alignItems: 'center',
          }}
        >
          {/* Video Container */}
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg, 16px)',
              overflow: 'hidden',
              background: '#0d0d14',
              border: '1px solid var(--color-border)',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.4)',
              aspectRatio: isVertical ? '9 / 16' : '16 / 9',
              width: '100%',
              maxHeight: isVertical ? '600px' : 'none',
              margin: isVertical ? '0 auto' : undefined,
            }}
          >
            {config.badgeText && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  zIndex: 10,
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(8px)',
                  color: '#38bdf8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                {config.badgeText}
              </div>
            )}

            {/* Video or Embed Player */}
            {isEmbed && embedUrl ? (
              <iframe
                src={embedUrl}
                title={config.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  width: '100%',
                  height: '100%',
                  border: 0,
                  display: 'block',
                }}
              />
            ) : embedUrl ? (
              <video
                src={embedUrl}
                poster={config.posterUrl}
                autoPlay
                loop
                muted
                playsInline
                controls
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : config.posterUrl ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={config.posterUrl}
                  alt={config.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(6px)',
                      border: '2px solid rgba(255,255,255,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '24px',
                      paddingLeft: '4px',
                    }}
                  >
                    ▶
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '32px', marginBottom: '8px' }}>📹</span>
                <p style={{ fontSize: '13px', margin: 0 }}>No video configured yet.</p>
                <p style={{ fontSize: '11px', opacity: 0.7, margin: '4px 0 0' }}>
                  Click Quick Edit to paste a video URL or upload a file.
                </p>
              </div>
            )}
          </div>

          {/* Copy & Details */}
          <div>
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: 'var(--color-accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 'var(--space-3)',
              }}
            >
              Verified Demonstration
            </span>

            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 900,
                lineHeight: 1.15,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.025em',
                marginBottom: 'var(--space-4)',
              }}
            >
              {config.title}
            </h2>

            <p
              style={{
                fontSize: 'var(--text-lg)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                marginBottom: 'var(--space-6)',
              }}
            >
              {config.subtitle}
            </p>

            {/* Bullet Points */}
            {config.bulletPoints && config.bulletPoints.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
                {config.bulletPoints.map((bp, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: '#22c55e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </div>
                    <span style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {bp}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Button */}
            {config.ctaText && (
              <div>
                <Link
                  href={config.ctaLink || '/collections'}
                  className="btn btn-primary btn-lg"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>{config.ctaText}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
