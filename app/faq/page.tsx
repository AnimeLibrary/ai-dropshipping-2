import type { Metadata } from 'next'
import FaqSection from '@/components/home/FaqSection'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Vexsen Official Store',
  description:
    'Answers to the most common Vexsen questions: shipping times, return policy, order tracking, product ingredients, and more. Get help fast.',
  keywords: [
    'vexsen faq', 'vexsen shipping', 'vexsen returns', 'how long does vexsen ship',
    'vexsen return policy', 'vexsen order tracking',
  ],
  alternates: { canonical: '/faq' },
  openGraph: {
    type: 'website',
    url: '/faq',
    title: 'Frequently Asked Questions | Vexsen',
    description: 'Get answers about Vexsen shipping, returns, order tracking, and products.',
    siteName: 'Vexsen® Official Store',
  },
}

export default function FaqPage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <div style={{ 
        background: 'linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%)',
        padding: 'var(--space-12) 0 var(--space-8)' 
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ 
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-4)'
          }}>
            Frequently Asked Questions
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-lg)', maxWidth: 600, margin: '0 auto' }}>
            Everything you need to know about how we operate, ship, and guarantee our products.
          </p>
        </div>
      </div>

      <section style={{ padding: 'var(--space-8) 0 var(--space-16)' }}>
        <div className="container">
          <FaqSection />
        </div>
      </section>
    </div>
  )
}
