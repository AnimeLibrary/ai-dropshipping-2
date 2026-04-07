import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Curated Collections | TrendDrop',
  description: 'Themed product groupings for specific lifestyles.',
}

const COLLECTIONS = [
  { id: 'wfh-survival', title: 'The WFH Survival Kit', desc: 'Ergonomics and focus tools to survive the 9-to-5.', count: 4, emoji: '🖥️' },
  { id: 'deep-sleep', title: 'Deep Sleep Essentials', desc: 'Biological fixes for a hyperactive nervous system.', count: 6, emoji: '🌙' },
  { id: 'pet-sanity', title: 'Pet Owner Sanity', desc: 'Products that make living with animals 10x easier.', count: 3, emoji: '🐾' },
]

export default function CollectionsPage() {
  return (
    <>
      <div 
        style={{ 
          background: 'var(--color-bg-secondary)',
          padding: 'var(--space-20) 0 var(--space-12)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="container" style={{ textAlign: 'center' }}>
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
            Curated <span className="gradient-text">Collections</span>
          </h1>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', maxWidth: 640, margin: '0 auto' }}>
            We've bundled the top-performing solutions into thematic toolkits.
          </p>
        </div>
      </div>

      <div style={{ padding: 'var(--space-16) 0' }}>
        <div className="container">
          <div className="grid-2">
            {COLLECTIONS.map((col) => (
              <Link 
                key={col.id} 
                href={`/collections/${col.id}`}
                className="card"
                style={{ display: 'block', textDecoration: 'none', padding: 'var(--space-8)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <span style={{ fontSize: 48 }}>{col.emoji}</span>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                      {col.title}
                    </h3>
                    <span className="badge badge-neutral" style={{ marginTop: 'var(--space-2)' }}>{col.count} Validated Products</span>
                  </div>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
                  {col.desc}
                </p>
                <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                  View the Collection →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
