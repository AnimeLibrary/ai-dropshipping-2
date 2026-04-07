'use client'

import Link from 'next/link'

export default function LoginForm() {
  return (
    <form 
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} 
      onSubmit={(e) => e.preventDefault()}
    >
      <div>
        <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>
          Email Address
        </label>
        <input 
          type="email" 
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
      
      <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 'var(--space-4)' }}>
        Continue →
      </button>
    </form>
  )
}
