import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import '@/styles/globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import StickyCTA from '@/components/layout/StickyCTA'
import ThemeProvider from '@/components/layout/ThemeProvider'
import Analytics from '@/components/layout/Analytics'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://trenddrop.store'),
  title: {
    default: 'TrendDrop — Discover Products That Actually Work',
    template: '%s | TrendDrop',
  },
  description:
    'AI-powered product discovery. We find winning trending products, solve real problems, and deliver to your door. Multi-niche general store backed by data.',
  keywords: ['trending products', 'dropshipping', 'product discovery', 'winning products'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'TrendDrop',
  },
  twitter: { card: 'summary_large_image' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body className={`${inter.variable} ${outfit.variable}`}>
          <ThemeProvider>
            <Analytics />
            <Navbar />
            <main id="main-content">
              {children}
            </main>
            <StickyCTA />
            <Footer />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
