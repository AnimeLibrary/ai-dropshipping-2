import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

// Admin layout — completely isolated from the public site.
// No Navbar, no Footer, no StickyCTA. Raw command interface only.

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  const userEmail = user?.emailAddresses?.[0]?.emailAddress
  const adminEmail = process.env.ADMIN_EMAIL

  if (!user || userEmail !== adminEmail) {
    redirect('/')
  }

  return (
    <html lang="en">
      <head>
        <title>TrendDrop Admin</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
