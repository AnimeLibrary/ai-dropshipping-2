'use client'

import { useState } from 'react'

interface ProductGalleryProps {
  images: string[]
  title: string
}

function isVideoUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.includes('youtube.com/watch') ||
    lower.includes('youtu.be/') ||
    lower.includes('youtube.com/embed') ||
    lower.includes('vimeo.com')
  )
}

function getEmbedUrl(url: string): string | null {
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0]
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1`
  }
  if (url.includes('youtube.com/watch')) {
    const id = new URLSearchParams(url.split('?')[1]).get('v')
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1`
  }
  return null
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

  const currentMedia = images[currentIndex] || images[0]
  const isVideo = isVideoUrl(currentMedia)
  const embedUrl = isVideo ? getEmbedUrl(currentMedia) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Main Showcase Stage */}
      <div style={{
        aspectRatio: '4/3',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: '#09090e',
        border: '1px solid var(--color-border)',
        position: 'relative'
      }}>
        {isVideo ? (
          embedUrl ? (
            <iframe
              src={embedUrl}
              title={`${title} Video Showcase`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={currentMedia}
              controls
              autoPlay
              muted
              loop
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={currentMedia}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s ease-in-out' }}
          />
        )}

        {isVideo && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            borderRadius: 'var(--radius-full)', padding: '4px 10px',
            fontSize: '11px', fontWeight: 800, color: '#f43f5e',
            display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(244,63,94,0.3)'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f43f5e' }} />
            AI VIDEO DEMO
          </div>
        )}
      </div>

      {/* Thumbnails (Supports Pictures & Videos) */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-2)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {images.map((item, idx) => {
            const itemIsVideo = isVideoUrl(item)
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: 68,
                  height: 68,
                  flexShrink: 0,
                  padding: 0,
                  background: '#111118',
                  border: currentIndex === idx ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  opacity: currentIndex === idx ? 1 : 0.6,
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {itemIsVideo ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c1917', color: '#f43f5e', fontSize: '18px' }}>
                    ▶
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={item} alt={`${title} media ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {itemIsVideo && (
                  <span style={{ position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '8px', fontWeight: 800, padding: '1px 3px', borderRadius: 3 }}>
                    VIDEO
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
