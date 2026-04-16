import { currentUser } from '@clerk/nextjs/server'
import type { Metadata } from 'next'

// Admin layout — completely isolated from the public site.
// No Navbar, no Footer, no StickyCTA. Raw command interface only.

export const metadata: Metadata = {
  title: 'Vexsen Admin',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  const userEmail = user?.emailAddresses?.[0]?.emailAddress
  const adminEmail = process.env.ADMIN_EMAIL

  if (!user || userEmail !== adminEmail) {
    return (
      <div style={{ padding: '50px', background: 'white', color: 'black', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: 'red' }}>Admin Access Denied</h1>
        <p><strong>Your Signed-In Email:</strong> {userEmail || 'NULL / Not Found (Check Clerk Keys)'}</p>
        <p><strong>Expected Admin Email:</strong> {adminEmail || 'NULL (Check Vercel Dashboard)'}</p>
        <p style={{ marginTop: '20px' }}><em>DEBUG MODE: If these match but it still fails, check for spaces or capitalization. If one is NULL, Vercel is missing that Environment Variable.</em></p>
      </div>
    )
  }

  return (
    <div style={{ margin: 0, padding: 0, minHeight: '100vh' }}>
      {children}
    </div>
  )
}
