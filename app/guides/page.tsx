import type { Metadata } from 'next'
import Link from 'next/link'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Guides & Case Studies | TrendDrop',
  description: 'Deep dives into chronic problems and the products that actually fix them.',
}

export default async function GuidesPage() {
  const clusters = await prisma.keywordCluster.findMany({
    where: { trend: 'rising' },
    orderBy: { searchVolume: 'desc' }
  })
  const featured = clusters[0]
  const rest = clusters.slice(1)

  return (
    <>
      <div 
        style={{ 
          background: 'var(--color-bg-secondary)',
          padding: 'var(--space-20) 0 var(--space-16)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="container">
          <h1 
            style={{ 
              fontFamily: 'var(--font-heading)', 
              fontSize: 'clamp(2rem, 4vw, 3rem)', 
              fontWeight: 800, 
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-4)',
              letterSpacing: '-0.02em'
            }}
          >
            The <span className="gradient-text">Research</span>
          </h1>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', maxWidth: 640 }}>
            We research the biology, mechanics, and data behind modern annoyances. Know *why* something is happening before you buy the fix.
          </p>
        </div>
      </div>

      <div style={{ padding: 'var(--space-16) 0' }}>
        <div className="container">
          {/* Editorial Featured Guide */}
          {featured && (
            <Link href={`/guides/${featured.targetSlug}`} style={{ display: 'block', textDecoration: 'none', marginBottom: 'var(--space-16)' }}>
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-accent)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  transition: 'transform 0.2s',
                }}
                className="featured-guide-card"
              >
                <div style={{ background: 'var(--color-border)', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 64 }}>{featured.trend === 'rising' ? '📈' : '📚'}</span>
                </div>
                <div style={{ padding: 'var(--space-10)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span className="badge badge-accent" style={{ alignSelf: 'flex-start', marginBottom: 'var(--space-4)' }}>
                    Featured Research
                  </span>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)' }}>
                    Why {featured.painPoint?.toLowerCase() || 'does this keep happening'}?
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)', lineHeight: 1.7, marginBottom: 'var(--space-6)' }}>
                    A deep dive into the underlying mechanics of this problem, and why traditional solutions fail. Plus, the data-backed product that actually solves it.
                  </p>
                  <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>Read the Case Study →</span>
                </div>
              </div>
            </Link>
          )}

          {/* Grid for the rest */}
          <div className="grid-3">
            {rest.map((cluster) => (
              <Link 
                key={cluster.id} 
                href={`/guides/${cluster.targetSlug}`}
                className="card"
                style={{ display: 'block', textDecoration: 'none' }}
              >
                <div style={{ background: 'var(--color-bg-secondary)', height: 160, borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <span style={{ fontSize: 32 }}>📚</span>
                </div>
                <div className="card-body">
                  <span className="badge badge-neutral" style={{ marginBottom: 'var(--space-3)' }}>
                    {cluster.niche.replace(/-/g, ' ')}
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
                     Why {cluster.painPoint?.toLowerCase() || cluster.keyword}?
                  </h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                    {cluster.searchVolume.toLocaleString()} people searched this month.
                  </p>
                  <span style={{ color: 'var(--color-accent)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                    Read format →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
