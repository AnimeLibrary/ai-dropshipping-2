import { getAdminUser } from '@/lib/auth/admin'
import type { Metadata } from 'next'

// Admin layout — completely isolated from the public site.
// No Navbar, no Footer, no StickyCTA. Raw command interface only.

export const metadata: Metadata = {
  title: 'Vexsen Admin',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser()

  if (!admin) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: '#12121c', border: '1px solid #28283c', borderRadius: '16px', padding: '36px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>
            🔒
          </div>
          <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Restricted Access</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            This command dashboard is strictly reserved for the Vexsen owner account.
          </p>
          <a href="/account" style={{ display: 'inline-block', width: '100%', background: '#7c3aed', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
            Sign In with Owner Account
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ margin: 0, padding: 0, minHeight: '100vh' }}>
      {children}
    </div>
  )
}
