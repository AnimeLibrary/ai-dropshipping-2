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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://vexsen.store'),
  title: {
    default: 'Vexsen — Curated for Everyday Life',
    template: '%s | Vexsen',
  },
  description:
    'Functional design. Uncompromising quality. Vexsen builds and curates solutions designed to elevate your everyday routines.',
  keywords: ['premium products', 'vexsen', 'lifestyle solutions', 'quality goods'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Vexsen',
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
