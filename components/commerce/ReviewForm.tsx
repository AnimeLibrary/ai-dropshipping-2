'use client'

import { useState } from 'react'

interface Props {
  productSlug: string
}

export default function ReviewForm({ productSlug }: Props) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) { setMessage('Please select a star rating.'); setStatus('error'); return }
    setStatus('loading')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug, rating, title, body, authorName: name, authorEmail: email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus('success')
      setMessage(data.message)
      setRating(0); setName(''); setEmail(''); setTitle(''); setBody('')
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message || 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)', textAlign: 'center' }}>
        <p style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>✅</p>
        <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>Thank you for your review!</p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{message}</p>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-bg)',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none',
    fontFamily: 'var(--font-inter)', boxSizing: 'border-box'
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Star Rating */}
      <div>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
          Your Rating <span style={{ color: 'var(--color-accent)' }}>*</span>
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-1)', cursor: 'pointer' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              style={{ fontSize: '1.75rem', color: (hovered || rating) >= star ? '#F59E0B' : 'var(--color-border)', transition: 'color 0.1s', userSelect: 'none' }}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Name + Email */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <div>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Name *
          </label>
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Email (optional)
          </label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} />
        </div>
      </div>

      {/* Title */}
      <div>
        <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Review Title (optional)
        </label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Game changer for my routine" style={inputStyle} />
      </div>

      {/* Body */}
      <div>
        <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Your Review *
        </label>
        <textarea
          required
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Tell us about your experience with this product..."
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
        />
      </div>

      {status === 'error' && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error)', margin: 0 }}>⚠️ {message}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn btn-primary"
        style={{ alignSelf: 'flex-start', opacity: status === 'loading' ? 0.6 : 1, cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}
      >
        {status === 'loading' ? 'Submitting…' : 'Submit Review →'}
      </button>

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
        All reviews are moderated before publishing. Your email will never be shared.
      </p>
    </form>
  )
}
