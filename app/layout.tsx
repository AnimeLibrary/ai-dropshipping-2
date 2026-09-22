import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import '@/styles/globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import StickyCTA from '@/components/layout/StickyCTA'
import ThemeProvider from '@/components/layout/ThemeProvider'
import AdsTrackingProvider from '@/components/layout/AdsTrackingProvider'
import Analytics from '@/components/layout/Analytics'
import SupportChat from '@/components/layout/SupportChat'
import { siteConfig } from '@/lib/config/site'

// Notice: Google fonts disabled temporarily to prevent Next.js build crashes on slow hotspot connections.
// Using system font fallbacks via globals.css for now.

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: 'Vexsen - Curated for Everyday Life',
    template: '%s | Vexsen',
  },
  description: siteConfig.description,
  keywords: ['premium products', 'vexsen', 'lifestyle solutions', 'quality goods'],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/icon.svg'],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Vexsen',
    url: siteConfig.url,
    images: [
      {
        url: `${siteConfig.url}/icon.svg`,
        width: 512,
        height: 512,
        alt: 'Vexsen Brand Emblem',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`${siteConfig.url}/icon.svg`],
  },
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
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Vexsen',
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.svg`,
    image: `${siteConfig.url}/icon.svg`,
  }

  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_dWx0aW1hdGUtZWdyZXQtMzUuY2xlcmsuYWNjb3VudHMuZGV2JA'}>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" type="image/svg+xml" href="/icon.svg" />
          <link rel="alternate icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/apple-icon" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
          />
        </head>
        <body>
          <AdsTrackingProvider>
            <ThemeProvider>
              <Analytics />
              <Navbar />
              <main id="main-content">
                {children}
              </main>
              <StickyCTA />
              <SupportChat />
              <Footer />
            </ThemeProvider>
          </AdsTrackingProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
