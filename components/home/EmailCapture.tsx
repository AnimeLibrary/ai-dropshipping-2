'use client'

import { useState } from 'react'

export default function EmailCapture() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || status === 'loading' || status === 'done') return
    setStatus('loading')
    try {
      // Mailchimp / Klaviyo / any list endpoint — wire up later
      // For now, we store locally or send to a simple API
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div
      id="email-capture"
      style={{
        background: 'linear-gradient(135deg, var(--color-bg-secondary) 0%, rgba(124,58,237,0.07) 100%)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-10) var(--space-8)',
        textAlign: 'center',
        maxWidth: 560,
        margin: '0 auto',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          background: 'rgba(124,58,237,0.12)',
          color: 'var(--color-accent)',
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          padding: '4px 12px',
          borderRadius: 999,
          marginBottom: 'var(--space-4)',
        }}
      >
        ⚡ Early Access
      </span>

      <h2
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(1.35rem, 3vw, 1.75rem)',
          fontWeight: 800,
          color: 'var(--color-text-primary)',
          lineHeight: 1.2,
          marginBottom: 'var(--space-3)',
          letterSpacing: '-0.02em',
        }}
      >
        Get new picks before they sell out.
      </h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-6)',
          lineHeight: 1.6,
        }}
      >
        We drop 2–3 tested products a week. Subscribers see them first — before they hit the store.
        No spam. Unsubscribe any time.
      </p>

      {status === 'done' ? (
        <div
          style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            color: 'var(--color-success)',
            fontWeight: 700,
            fontSize: 'var(--text-sm)',
          }}
        >
          ✅ You're in. We'll send you the next drop first.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            id="email-capture-input"
            aria-label="Email address for early access"
            style={{
              flex: '1 1 220px',
              padding: '12px 16px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--text-sm)',
              outline: 'none',
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            id="email-capture-submit"
            disabled={status === 'loading'}
            className="btn btn-primary"
            style={{ flexShrink: 0, opacity: status === 'loading' ? 0.7 : 1 }}
          >
            {status === 'loading' ? 'Joining…' : 'Get Early Access →'}
          </button>
        </form>
      )}
      {status === 'error' && (
        <p style={{ fontSize: 'var(--text-xs)', color: '#ef4444', marginTop: 8 }}>
          Something went wrong. Try again.
        </p>
      )}
    </div>
  )
}
