import type { Metadata } from 'next'
import Link from 'next/link'
import { getRisingClusters } from '@/lib/data/keywords'
import GuidePreview from '@/components/home/GuidePreview'

export const metadata: Metadata = {
  title: 'Guides & Case Studies | TrendDrop',
  description: 'Deep dives into chronic problems and the products that actually fix them.',
}

export default function GuidesPage() {
  const clusters = getRisingClusters()

  return (
    <div style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)' }}>
      <div className="container" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)' }}>
            The Guides
          </h1>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            We research the biology, mechanics, and data behind modern annoyances. If you want to know *why* something is happening before you buy a solution, start here.
          </p>
        </div>
        
        <GuidePreview clusters={clusters} />
      </div>
    </div>
  )
}
