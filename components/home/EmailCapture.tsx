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
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="email-capture-panel" id="email-capture">
      <span className="badge badge-neutral">Private drop list</span>

      <h2>Get the next approved drop first.</h2>
      <p>
        Subscribers see new verified products before they hit the main collection. No spam, no fake countdowns, no daily blast.
      </p>

      {status === 'done' ? (
        <div className="email-capture-success">
          You are in. We will send you the next drop first.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="email-capture-form">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            id="email-capture-input"
            aria-label="Email address for early access"
          />
          <button
            type="submit"
            id="email-capture-submit"
            disabled={status === 'loading'}
            className="btn btn-primary"
            style={{ opacity: status === 'loading' ? 0.7 : 1 }}
          >
            {status === 'loading' ? 'Joining...' : 'Get Early Access'}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p className="email-capture-error">
          Something went wrong. Try again.
        </p>
      )}
    </div>
  )
}
