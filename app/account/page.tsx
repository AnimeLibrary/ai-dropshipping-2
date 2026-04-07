import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'My Account | TrendDrop'
}

export default async function AccountPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div style={{ minHeight: '80vh', padding: 'var(--space-12) 0' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
          Welcome back, {user.firstName || 'Shopper'}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)' }}>
          Manage your orders, subscriptions, and profile settings here.
        </p>

        <div style={{ display: 'grid', gap: 'var(--space-6)', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {/* Order History */}
          <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <span style={{ fontSize: '1.5rem' }}>📦</span>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Order History</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8) 0', color: 'var(--color-text-muted)' }}>
              <p>No recent orders found.</p>
              <button className="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }}>
                Browse Solutions
              </button>
            </div>
          </div>

          {/* Account Details */}
          <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <span style={{ fontSize: '1.5rem' }}>⚙️</span>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Account Details</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</span>
                <span style={{ fontWeight: 500 }}>{user.emailAddresses[0]?.emailAddress}</span>
              </div>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>Profile Management</span>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  To fully manage your security settings, passwords, or connected accounts, click your avatar in the top right menu block.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
