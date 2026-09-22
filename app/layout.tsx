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
    default: 'Vexsen® Official Store — Waterproof Lip Stains & Juicy Lip Oils',
    template: '%s | Vexsen® Official Store',
  },
  description: siteConfig.description,
  keywords: [
    'vexsen',
    'vexsen official store',
    'vexsen lip stain',
    'vexsen lip oil',
    'peel off lip stain',
    'waterproof lip stain 24h',
    'juicy lip oil',
    'transfer proof lip tint'
  ],
  icons: {
    icon: [
      { url: '/icon', sizes: '96x96', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/icon'],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Vexsen Official Store',
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
  const storeSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'OnlineStore',
        '@id': `${siteConfig.url}/#store`,
        name: 'Vexsen',
        alternateName: ['Vexsen Official Store', 'Vexsen Beauty', 'vexsen.com'],
        url: siteConfig.url,
        logo: `${siteConfig.url}/icon.svg`,
        image: `${siteConfig.url}/icon.svg`,
        description: siteConfig.description,
        priceRange: '$$',
        currenciesAccepted: 'USD',
        paymentAccepted: 'Credit Card, Apple Pay, Google Pay',
      },
      {
        '@type': 'WebSite',
        '@id': `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: 'Vexsen',
        alternateName: 'Vexsen Store',
        publisher: { '@id': `${siteConfig.url}/#store` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }

  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_dWx0aW1hdGUtZWdyZXQtMzUuY2xlcmsuYWNjb3VudHMuZGV2JA'}>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" type="image/png" sizes="96x96" href="/icon" />
          <link rel="icon" type="image/svg+xml" href="/icon.svg" />
          <link rel="alternate icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/apple-icon" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
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
