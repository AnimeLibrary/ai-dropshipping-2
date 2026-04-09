import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Fix Kits & Bundles | TrendDrop',
  description: 'Complete systemic fixes bundled for a lower price.',
}

import { getApprovedBundles } from '@/lib/data/bundles'
import { getProductBySlug } from '@/lib/data/products'

export default function BundlesPage() {
  const bundles = getApprovedBundles()

  return (
    <>
      <div 
        style={{ 
          background: 'linear-gradient(135deg, var(--color-bg-secondary) 0%, rgba(124,58,237,0.06) 100%)',
          padding: 'var(--space-20) 0 var(--space-16)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="badge badge-accent" style={{ marginBottom: 'var(--space-4)' }}>
            Systemic Fixes
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
            Bundles & <span className="gradient-text">Fix Kits</span>
          </h1>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', maxWidth: 640, margin: '0 auto' }}>
            Some problems require a multi-angle approach. We bundled complementary products together so you can fix the root cause completely, while saving money.
          </p>
        </div>
      </div>

      <div style={{ padding: 'var(--space-16) 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gap: 'var(--space-12)' }}>
            {bundles.map((bundle) => (
              <div 
                key={bundle.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-8)',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                }}
                className="bundle-card"
              >
                {/* Left: Image Box */}
                <div style={{ position: 'relative', minHeight: 400, background: 'var(--color-bg)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={bundle.heroImage} 
                    alt={bundle.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      top: 'var(--space-4)',
                      right: 'var(--space-4)',
                      background: 'var(--color-accent)',
                      color: 'white',
                      fontWeight: 800,
                      padding: 'var(--space-2) var(--space-4)',
                      borderRadius: 'var(--radius-full)',
                      boxShadow: '0 4px 12px rgba(124,58,237,0.3)'
                    }}
                  >
                    Best Value
                  </div>
                </div>

                {/* Right: Content Box */}
                <div style={{ padding: 'var(--space-10)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)', letterSpacing: '-0.02em' }}>
                    {bundle.title}
                  </h2>
                  <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-accent)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                    Save ${(bundle.compareAtPrice - bundle.price).toFixed(2)}
                  </p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
                    {bundle.shortDescription}
                  </p>
                  
                  <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-3)' }}>
                      The Triple-Threat Components:
                    </p>
                    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                      {bundle.productIds.map(id => {
                        const product = getProductBySlug(id)
                        return (
                          <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                            <span style={{ fontSize: 'var(--text-sm)' }}>
                                <strong>{product?.title || id}</strong>
                            </span>
                            <Link href={`/products/${id}`} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', textDecoration: 'none', borderBottom: '1px solid currentColor' }}>
                              View Single →
                            </Link>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex-between" style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-6)' }}>
                    <div>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                        ${bundle.price.toFixed(2)}
                      </span>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', textDecoration: 'line-through', marginLeft: 'var(--space-3)' }}>
                        Value: ${bundle.compareAtPrice.toFixed(2)}
                      </span>
                    </div>
                    <button className="btn btn-primary" style={{ padding: 'var(--space-4) var(--space-8)' }}>
                      Get Triple Bundle →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
