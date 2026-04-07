import type { Metadata } from 'next'
import { getApprovedProducts } from '@/lib/data/products'
import TrendingProducts from '@/components/home/TrendingProducts'

export const metadata: Metadata = {
  title: 'Validated Solutions | TrendDrop',
  description: 'The 9% of products that actually passed our human and data validation.',
}

export default function SolutionsPage() {
  // In a real scenario, this would paginate or filter. 
  // We'll just show all approved products for the prototype.
  const products = getApprovedProducts()

  return (
    <>
      <div 
        style={{ 
          background: 'var(--color-bg-secondary)',
          padding: 'var(--space-20) 0 var(--space-12)',
          borderBottom: '1px solid var(--color-border)',
          textAlign: 'center'
        }}
      >
        <div className="container" style={{ maxWidth: 800 }}>
          <span className="badge badge-success" style={{ marginBottom: 'var(--space-4)' }}>
            ✓ 100% Validated
          </span>
          <h1 
            style={{ 
              fontFamily: 'var(--font-heading)', 
              fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
              fontWeight: 800, 
              color: 'var(--color-text-primary)',
              lineHeight: 1.1,
              marginBottom: 'var(--space-4)',
              letterSpacing: '-0.03em'
            }}
          >
            All Validated <span className="gradient-text">Solutions</span>
          </h1>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', maxWidth: 640, margin: '0 auto' }}>
            We analyzed hundreds of trending products this week. Only these made the cut. Every product here has proven ad performance and human approval.
          </p>
        </div>
      </div>

      <div style={{ padding: 'var(--space-16) 0' }}>
        <div className="container">
          <TrendingProducts products={products} />
        </div>
      </div>
    </>
  )
}
