'use client'

import React, { useState, useRef } from 'react'
import type { LandingMediaConfig, MediaCardItem } from '@/lib/landing-media'

interface QuickEditLandingProps {
  config: LandingMediaConfig
  onChange: (config: LandingMediaConfig) => void
  isOpen: boolean
  onToggle: () => void
  activeSection: string
  setActiveSection: (sec: string) => void
}

export default function QuickEditLanding({
  config,
  onChange,
  isOpen,
  onToggle,
  activeSection,
  setActiveSection,
}: QuickEditLandingProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [targetUploadKey, setTargetUploadKey] = useState<{
    section: 'hero' | 'videoShowcase' | 'gallery'
    field: string
    index?: number
  } | null>(null)

  // Handle uploading files (images or videos)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !targetUploadKey) return

    setUploadingField(`${targetUploadKey.section}-${targetUploadKey.field}-${targetUploadKey.index ?? ''}`)
    setErrorMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to upload media')
      }

      const uploadedUrl = data.url

      // Apply uploaded URL to config
      if (targetUploadKey.section === 'hero') {
        const isVideo = file.type.startsWith('video/')
        onChange({
          ...config,
          hero: {
            ...config.hero,
            [targetUploadKey.field]: uploadedUrl,
            type: targetUploadKey.field === 'videoUrl' ? 'video' : targetUploadKey.field === 'imageUrl' ? 'image' : config.hero.type,
          },
        })
      } else if (targetUploadKey.section === 'videoShowcase') {
        onChange({
          ...config,
          videoShowcase: {
            ...config.videoShowcase,
            [targetUploadKey.field]: uploadedUrl,
          },
        })
      } else if (targetUploadKey.section === 'gallery' && targetUploadKey.index !== undefined) {
        const newItems = [...config.gallery.items]
        const isVideo = file.type.startsWith('video/')
        newItems[targetUploadKey.index] = {
          ...newItems[targetUploadKey.index],
          [targetUploadKey.field]: uploadedUrl,
          type: isVideo ? 'video' : 'image',
        }
        onChange({
          ...config,
          gallery: {
            ...config.gallery,
            items: newItems,
          },
        })
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      setErrorMessage(err.message || 'Error uploading file')
    } finally {
      setUploadingField(null)
      setTargetUploadKey(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const triggerUpload = (
    section: 'hero' | 'videoShowcase' | 'gallery',
    field: string,
    index?: number
  ) => {
    setTargetUploadKey({ section, field, index })
    fileInputRef.current?.click()
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    setErrorMessage(null)

    try {
      const res = await fetch('/api/admin/landing-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save changes')
      }

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3500)
    } catch (err: any) {
      console.error('Save error:', err)
      setSaveStatus('error')
      setErrorMessage(err.message || 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Reset all landing media to default factory settings?')) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/landing-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      })
      const data = await res.json()
      if (data.config) {
        onChange(data.config)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 3500)
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Reset failed')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {/* Hidden File Input for Native Media Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Floating Bottom Quick Edit Launcher */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <button
          onClick={onToggle}
          type="button"
          aria-label="Toggle Quick Edit Panel"
          style={{
            background: isOpen ? '#1e1b4b' : '#0f0f17',
            border: '1.5px solid #7c3aed',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 30px rgba(124, 58, 237, 0.35)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <span style={{ fontSize: '15px' }}>⚡</span>
          <span>{isOpen ? 'Close Quick Edit' : 'Quick Edit Landing Media'}</span>
        </button>
      </div>

      {/* Slide-over Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: '520px',
            background: '#0c0c14',
            borderLeft: '1px solid #232338',
            boxShadow: '-10px 0 50px rgba(0, 0, 0, 0.7)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#e2e8f0',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '18px 22px',
              borderBottom: '1px solid #232338',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#12121e',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🎨</span>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  Landing Page Media Editor
                </h2>
                <p style={{ fontSize: '11px', margin: '2px 0 0', color: '#94a3b8' }}>
                  Swap pictures, videos & copy in real time.
                </p>
              </div>
            </div>
            <button
              onClick={onToggle}
              type="button"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px 8px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #232338',
              background: '#0e0e18',
              padding: '4px 12px 0',
              gap: '6px',
            }}
          >
            {[
              { id: 'hero', label: '📸 Hero Media' },
              { id: 'videoShowcase', label: '🎬 Video Demo' },
              { id: 'gallery', label: '🖼️ Proof Cards' },
            ].map((tab) => {
              const isActive = activeSection === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  type="button"
                  style={{
                    padding: '10px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #7c3aed' : '2px solid transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'color 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Scrollable Content Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* TAB 1: HERO MEDIA */}
            {activeSection === 'hero' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#141422', padding: '16px', borderRadius: '12px', border: '1px solid #282840' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#a78bfa', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Hero Media Mode
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {[
                      { id: 'product', label: 'Product' },
                      { id: 'image', label: 'Custom Img' },
                      { id: 'video', label: 'MP4 Video' },
                      { id: 'embed', label: 'Embed (YT)' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onChange({ ...config, hero: { ...config.hero, type: m.id as any } })}
                        style={{
                          padding: '8px 4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          borderRadius: '8px',
                          border: config.hero.type === m.id ? '1px solid #7c3aed' : '1px solid #2a2a44',
                          background: config.hero.type === m.id ? '#7c3aed' : '#1a1a2e',
                          color: '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hero Image Section */}
                {(config.hero.type === 'image' || config.hero.type === 'product') && (
                  <div style={{ background: '#141422', padding: '16px', borderRadius: '12px', border: '1px solid #282840' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0' }}>
                        Custom Hero Image
                      </label>
                      <button
                        type="button"
                        onClick={() => triggerUpload('hero', 'imageUrl')}
                        disabled={!!uploadingField}
                        style={{
                          background: '#7c3aed',
                          color: '#fff',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {uploadingField === 'hero-imageUrl-' ? 'Uploading...' : '📁 Upload Image'}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="https://... or /uploads/..."
                      value={config.hero.imageUrl || ''}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          hero: { ...config.hero, imageUrl: e.target.value, type: 'image' },
                        })
                      }
                      style={{
                        width: '100%',
                        background: '#090910',
                        border: '1px solid #2d2d48',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    {config.hero.imageUrl && (
                      <div style={{ marginTop: '10px', width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2a2a40' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={config.hero.imageUrl} alt="Hero Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Hero Video Section */}
                {(config.hero.type === 'video' || config.hero.type === 'embed') && (
                  <div style={{ background: '#141422', padding: '16px', borderRadius: '12px', border: '1px solid #282840' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0' }}>
                        Hero Video URL or MP4 File
                      </label>
                      <button
                        type="button"
                        onClick={() => triggerUpload('hero', 'videoUrl')}
                        disabled={!!uploadingField}
                        style={{
                          background: '#7c3aed',
                          color: '#fff',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {uploadingField === 'hero-videoUrl-' ? 'Uploading...' : '📁 Upload MP4'}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Paste MP4 URL, YouTube or Vimeo link"
                      value={config.hero.videoUrl || ''}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          hero: { ...config.hero, videoUrl: e.target.value },
                        })
                      }
                      style={{
                        width: '100%',
                        background: '#090910',
                        border: '1px solid #2d2d48',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />

                    {/* Poster Fallback */}
                    <div style={{ marginTop: '12px' }}>
                      <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                        Video Poster Image (Optional)
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Poster image URL"
                          value={config.hero.posterUrl || ''}
                          onChange={(e) =>
                            onChange({
                              ...config,
                              hero: { ...config.hero, posterUrl: e.target.value },
                            })
                          }
                          style={{
                            flex: 1,
                            background: '#090910',
                            border: '1px solid #2d2d48',
                            color: '#fff',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '11px',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => triggerUpload('hero', 'posterUrl')}
                          style={{
                            background: '#232338',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Upload
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hero Headlines & Text */}
                <div style={{ background: '#141422', padding: '16px', borderRadius: '12px', border: '1px solid #282840' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#a78bfa', marginBottom: '12px', textTransform: 'uppercase' }}>
                    Hero Text & Badge
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Badge / Curation Header</span>
                      <input
                        type="text"
                        value={config.hero.badgeText || ''}
                        onChange={(e) => onChange({ ...config, hero: { ...config.hero, badgeText: e.target.value } })}
                        style={{ width: '100%', background: '#090910', border: '1px solid #2d2d48', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Headline</span>
                      <input
                        type="text"
                        value={config.hero.title || ''}
                        onChange={(e) => onChange({ ...config, hero: { ...config.hero, title: e.target.value } })}
                        style={{ width: '100%', background: '#090910', border: '1px solid #2d2d48', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Subtitle</span>
                      <textarea
                        rows={3}
                        value={config.hero.subtitle || ''}
                        onChange={(e) => onChange({ ...config, hero: { ...config.hero, subtitle: e.target.value } })}
                        style={{ width: '100%', background: '#090910', border: '1px solid #2d2d48', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: VIDEO SHOWCASE */}
            {activeSection === 'videoShowcase' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Enable toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#141422', padding: '14px 16px', borderRadius: '12px', border: '1px solid #282840' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#ffffff' }}>Enable Video Demo Section</strong>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>Display full viral video test on landing page</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.videoShowcase.enabled}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        videoShowcase: { ...config.videoShowcase, enabled: e.target.checked },
                      })
                    }
                    style={{ width: '18px', height: '18px', accentColor: '#7c3aed', cursor: 'pointer' }}
                  />
                </div>

                {/* Video Format & URL */}
                <div style={{ background: '#141422', padding: '16px', borderRadius: '12px', border: '1px solid #282840' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0' }}>Video URL or File</label>
                    <button
                      type="button"
                      onClick={() => triggerUpload('videoShowcase', 'videoUrl')}
                      disabled={!!uploadingField}
                      style={{
                        background: '#7c3aed',
                        color: '#fff',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {uploadingField === 'videoShowcase-videoUrl-' ? 'Uploading...' : '📁 Upload Video'}
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Paste direct MP4, YouTube, or Vimeo URL"
                    value={config.videoShowcase.videoUrl || ''}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        videoShowcase: { ...config.videoShowcase, videoUrl: e.target.value },
                      })
                    }
                    style={{ width: '100%', background: '#090910', border: '1px solid #2d2d48', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px' }}
                  />

                  {/* Aspect Ratio */}
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
                      Aspect Ratio
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[
                        { id: '16:9', label: '16:9 Cinematic Wide' },
                        { id: '9:16', label: '9:16 Vertical (TikTok/Reel)' },
                      ].map((ratio) => (
                        <button
                          key={ratio.id}
                          type="button"
                          onClick={() =>
                            onChange({
                              ...config,
                              videoShowcase: { ...config.videoShowcase, aspectRatio: ratio.id as any },
                            })
                          }
                          style={{
                            padding: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: config.videoShowcase.aspectRatio === ratio.id ? '1px solid #7c3aed' : '1px solid #2a2a44',
                            background: config.videoShowcase.aspectRatio === ratio.id ? '#7c3aed' : '#1a1a2e',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Poster image */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Poster / Thumbnail Image</span>
                      <button
                        type="button"
                        onClick={() => triggerUpload('videoShowcase', 'posterUrl')}
                        style={{ background: '#232338', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                      >
                        Upload Poster
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="https://... or /uploads/..."
                      value={config.videoShowcase.posterUrl || ''}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          videoShowcase: { ...config.videoShowcase, posterUrl: e.target.value },
                        })
                      }
                      style={{ width: '100%', background: '#090910', border: '1px solid #2d2d48', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </div>
                </div>

                {/* Video Copy & CTA */}
                <div style={{ background: '#141422', padding: '16px', borderRadius: '12px', border: '1px solid #282840' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#a78bfa', marginBottom: '10px', textTransform: 'uppercase' }}>
                    Title, Copy & CTA
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Badge Pill</span>
                      <input
                        type="text"
                        value={config.videoShowcase.badgeText || ''}
                        onChange={(e) => onChange({ ...config, videoShowcase: { ...config.videoShowcase, badgeText: e.target.value } })}
                        style={{ width: '100%', background: '#090910', border: '1px solid #2d2d48', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Section Title</span>
                      <input
                        type="text"
                        value={config.videoShowcase.title || ''}
                        onChange={(e) => onChange({ ...config, videoShowcase: { ...config.videoShowcase, title: e.target.value } })}
                        style={{ width: '100%', background: '#090910', border: '1px solid #2d2d48', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Subtitle</span>
                      <textarea
                        rows={2}
                        value={config.videoShowcase.subtitle || ''}
                        onChange={(e) => onChange({ ...config, videoShowcase: { ...config.videoShowcase, subtitle: e.target.value } })}
                        style={{ width: '100%', background: '#090910', border: '1px solid #2d2d48', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>CTA Button Text</span>
                      <input
                        type="text"
                        value={config.videoShowcase.ctaText || ''}
                        onChange={(e) => onChange({ ...config, videoShowcase: { ...config.videoShowcase, ctaText: e.target.value } })}
                        style={{ width: '100%', background: '#090910', border: '1px solid #2d2d48', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PROOF & GALLERY CARDS */}
            {activeSection === 'gallery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#141422', padding: '14px 16px', borderRadius: '12px', border: '1px solid #282840' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#ffffff' }}>Enable Proof Grid</strong>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>Display visual proof / before-and-after cards</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.gallery.enabled}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        gallery: { ...config.gallery, enabled: e.target.checked },
                      })
                    }
                    style={{ width: '18px', height: '18px', accentColor: '#7c3aed', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ background: '#141422', padding: '16px', borderRadius: '12px', border: '1px solid #282840' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#a78bfa', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Grid Headers
                  </label>
                  <input
                    type="text"
                    placeholder="Section Title"
                    value={config.gallery.title || ''}
                    onChange={(e) => onChange({ ...config, gallery: { ...config.gallery, title: e.target.value } })}
                    style={{ width: '100%', background: '#090910', border: '1px solid #2d2d48', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', marginBottom: '8px' }}
                  />
                  <input
                    type="text"
                    placeholder="Section Subtitle"
                    value={config.gallery.subtitle || ''}
                    onChange={(e) => onChange({ ...config, gallery: { ...config.gallery, subtitle: e.target.value } })}
                    style={{ width: '100%', background: '#090910', border: '1px solid #2d2d48', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
                  />
                </div>

                {/* Cards List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#e2e8f0', textTransform: 'uppercase' }}>
                      Visual Cards ({config.gallery.items.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newItem: MediaCardItem = {
                          id: `card-${Date.now()}`,
                          type: 'image',
                          url: 'https://cf.cjdropshipping.com/quick/product/1cf4594f-2b13-4c96-ae7c-82eef0f51f0a.jpg',
                          tag: 'New Result',
                          title: 'Waterproof Verification',
                          caption: 'Long-lasting wear test demo.',
                        }
                        onChange({
                          ...config,
                          gallery: { ...config.gallery, items: [...config.gallery.items, newItem] },
                        })
                      }}
                      style={{
                        background: '#232338',
                        color: '#a78bfa',
                        border: '1px solid #3b3b5c',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      + Add Card
                    </button>
                  </div>

                  {config.gallery.items.map((card, idx) => (
                    <div
                      key={card.id || idx}
                      style={{
                        background: '#141422',
                        border: '1px solid #282840',
                        borderRadius: '12px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#a78bfa' }}>Card #{idx + 1}</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => triggerUpload('gallery', 'url', idx)}
                            style={{
                              background: '#7c3aed',
                              color: '#fff',
                              border: 'none',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {uploadingField === `gallery-url-${idx}` ? 'Uploading...' : 'Upload Media'}
                          </button>
                          {config.gallery.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = config.gallery.items.filter((_, i) => i !== idx)
                                onChange({ ...config, gallery: { ...config.gallery, items: updated } })
                              }}
                              style={{
                                background: '#3f1515',
                                color: '#f87171',
                                border: 'none',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                cursor: 'pointer',
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Media URL */}
                      <input
                        type="text"
                        placeholder="Image or Video URL"
                        value={card.url || ''}
                        onChange={(e) => {
                          const newItems = [...config.gallery.items]
                          newItems[idx] = { ...newItems[idx], url: e.target.value }
                          onChange({ ...config, gallery: { ...config.gallery, items: newItems } })
                        }}
                        style={{ width: '100%', background: '#090910', border: '1px solid #2d2d48', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '11px' }}
                      />

                      {/* Tag, Title, Caption */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="Tag (e.g. Step 1)"
                          value={card.tag || ''}
                          onChange={(e) => {
                            const newItems = [...config.gallery.items]
                            newItems[idx] = { ...newItems[idx], tag: e.target.value }
                            onChange({ ...config, gallery: { ...config.gallery, items: newItems } })
                          }}
                          style={{ background: '#090910', border: '1px solid #2d2d48', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '11px' }}
                        />
                        <input
                          type="text"
                          placeholder="Card Title"
                          value={card.title || ''}
                          onChange={(e) => {
                            const newItems = [...config.gallery.items]
                            newItems[idx] = { ...newItems[idx], title: e.target.value }
                            onChange({ ...config, gallery: { ...config.gallery, items: newItems } })
                          }}
                          style={{ background: '#090910', border: '1px solid #2d2d48', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '11px' }}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Card caption..."
                        value={card.caption || ''}
                        onChange={(e) => {
                          const newItems = [...config.gallery.items]
                          newItems[idx] = { ...newItems[idx], caption: e.target.value }
                          onChange({ ...config, gallery: { ...config.gallery, items: newItems } })
                        }}
                        style={{ width: '100%', background: '#090910', border: '1px solid #2d2d48', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '11px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Footer Actions */}
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid #232338',
              background: '#12121e',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {errorMessage && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#fca5a5' }}>
                ⚠️ {errorMessage}
              </div>
            )}
            {saveStatus === 'saved' && (
              <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#86efac' }}>
                ✓ Landing media published and page revalidated!
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  flex: 2,
                  background: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: isSaving ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
                  transition: 'opacity 0.15s ease',
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? 'Publishing Changes...' : '💾 Save & Publish Changes'}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                style={{
                  flex: 1,
                  background: '#1e1e30',
                  color: '#94a3b8',
                  border: '1px solid #2d2d48',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
