import type { Metadata } from 'next'
import Link from 'next/link'
import ProblemCategories from '@/components/home/ProblemCategories'

export const metadata: Metadata = {
  title: 'Shop by Problem | TrendDrop',
  description: 'We don\'t organize by product type. We organize by the pain point you are actually dealing with.',
}

export default function ProblemsPage() {
  return (
    <div style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)' }}>
      <div className="container" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)' }}>
            Find Your Fix
          </h1>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Most stores group things by "electronics" or "home goods". We group them by the exact pain point they solve. Choose what you're dealing with below.
          </p>
        </div>
        
        <ProblemCategories />
      </div>
    </div>
  )
}
