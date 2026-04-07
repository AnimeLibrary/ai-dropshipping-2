'use client'

import { useState } from 'react'

export default function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate network request
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
    }, 1500)
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
        <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>✅</div>
        <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Order Found</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
          Your order is currently being processed and will ship soon. We've sent a tracking update to your email.
        </p>
        <button className="btn btn-primary" onClick={() => setSuccess(false)}>Track Another</button>
      </div>
    )
  }

  return (
    <form 
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} 
      onSubmit={handleSubmit}
    >
      <div>
        <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>
          Email Address
        </label>
        <input 
          type="email" 
          required
          placeholder="you@example.com"
          style={{
            width: '100%',
            padding: 'var(--space-3)',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)'
          }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>
          Order Number  / Password
        </label>
        <input 
          type="password" 
          required
          placeholder="Your order # or password"
          style={{
            width: '100%',
            padding: 'var(--space-3)',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)'
          }}
        />
      </div>
      
      <button 
        className="btn btn-primary btn-lg" 
        style={{ width: '100%', marginTop: 'var(--space-4)', opacity: loading ? 0.7 : 1 }}
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Continue →'}
      </button>
    </form>
  )
}
