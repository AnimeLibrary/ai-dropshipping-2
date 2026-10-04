import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import '@/styles/globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import StickyCTA from '@/components/layout/StickyCTA'
import ThemeProvider from '@/components/layout/ThemeProvider'
import AdsTrackingProvider from '@/components/layout/AdsTrackingProvider'
import Analytics from '@/components/layout/Analytics'
import LiveVisitorTracker from '@/components/layout/LiveVisitorTracker'
import SupportChat from '@/components/layout/SupportChat'
import { CartProvider } from '@/lib/context/CartContext'
import CartDrawer from '@/components/commerce/CartDrawer'
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
    'vexen',
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
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Vexsen Official Store',
    url: siteConfig.url,
    images: [
      {
        url: `${siteConfig.url}/logo.png`,
        width: 512,
        height: 512,
        alt: 'Vexsen Official Brand Emblem',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`${siteConfig.url}/logo.png`],
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
        '@type': ['Organization', 'OnlineStore'],
        '@id': `${siteConfig.url}/#organization`,
        name: 'Vexsen',
        legalName: 'Vexsen LLC',
        alternateName: ['Vexsen Official Store', 'Vexsen Beauty', 'vexsen.com', 'vexen'],
        url: siteConfig.url,
        logo: {
          '@type': 'ImageObject',
          '@id': `${siteConfig.url}/#logo`,
          url: `${siteConfig.url}/logo.png`,
          contentUrl: `${siteConfig.url}/logo.png`,
          width: 512,
          height: 512,
          caption: 'Vexsen',
        },
        image: `${siteConfig.url}/logo.png`,
        description: siteConfig.description,
        priceRange: '$$',
        currenciesAccepted: 'USD',
        paymentAccepted: 'Credit Card, Debit Card, Apple Pay, Google Pay',
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Vexsen Beauty Products',
          url: `${siteConfig.url}/collections`,
        },
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: 'support@vexsen.com',
            availableLanguage: 'English',
            hoursAvailable: {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              opens: '09:00',
              closes: '18:00',
            },
          },
        ],
        sameAs: [
          'https://www.tiktok.com/@vexsen',
          'https://www.instagram.com/vexsenofficial',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: 'Vexsen',
        alternateName: ['Vexsen Official Store', 'vexsen.com', 'vexen'],
        description: siteConfig.description,
        publisher: { '@id': `${siteConfig.url}/#organization` },
        inLanguage: 'en-US',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteConfig.url}/collections?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'WebPage',
        '@id': `${siteConfig.url}/#webpage`,
        url: siteConfig.url,
        name: 'Vexsen® Official Store — Waterproof Lip Stains & Juicy Lip Oils',
        isPartOf: { '@id': `${siteConfig.url}/#website` },
        about: { '@id': `${siteConfig.url}/#organization` },
        inLanguage: 'en-US',
      },
    ],
  }

  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_dWx0aW1hdGUtZWdyZXQtMzUuY2xlcmsuYWNjb3VudHMuZGV2JA'}>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
          <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
          <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
          <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.webmanifest" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
          />
        </head>
        <body>
          <AdsTrackingProvider>
            <ThemeProvider>
              <CartProvider>
                <Analytics />
                <LiveVisitorTracker />
                <Navbar />
                <main id="main-content">
                  {children}
                </main>
                <CartDrawer />
                <StickyCTA />
                <SupportChat />
                <Footer />
              </CartProvider>
            </ThemeProvider>
          </AdsTrackingProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
