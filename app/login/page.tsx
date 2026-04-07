import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Login / Track Order | TrendDrop',
  description: 'Access your order history or track a recent purchase.',
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)' }}>
      <div 
        style={{ 
          background: 'var(--color-bg-secondary)', 
          border: '1px solid var(--color-border)', 
          borderRadius: 'var(--radius-xl)', 
          padding: 'var(--space-10)', 
          maxWidth: 480, 
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <span style={{ fontSize: 48, display: 'inline-block', marginBottom: 'var(--space-2)' }}>👤</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)', letterSpacing: '-0.02em' }}>
            Track Your Order
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Enter your order number and email to check your status. Or sign in to view your full purchase history.
          </p>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} onSubmit={(e) => e.preventDefault()}>
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

        <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Don't have an account yet? <br/>
            You can still checkout as a guest on any product page.
          </p>
        </div>
      </div>
    </div>
  )
}
