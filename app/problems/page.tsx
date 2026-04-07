import type { Metadata } from 'next'
import Link from 'next/link'
import ProblemCategories from '@/components/home/ProblemCategories'

export const metadata: Metadata = {
  title: 'Shop by Problem | TrendDrop',
  description: "We don't organize by product type. We organize by the pain point you are actually dealing with.",
}

export default function ProblemsPage() {
  return (
    <>
      <div 
        style={{ 
          background: 'radial-gradient(ellipse at top, var(--color-bg-secondary) 0%, var(--color-bg) 100%)',
          padding: 'var(--space-20) 0 var(--space-12)',
          borderBottom: '1px solid var(--color-border)',
          textAlign: 'center'
        }}
      >
        <div className="container" style={{ maxWidth: 800 }}>
          <span className="badge badge-accent" style={{ marginBottom: 'var(--space-4)' }}>
            The Diagnostic Hub
          </span>
          <h1 
            style={{ 
              fontFamily: 'var(--font-heading)', 
              fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
              fontWeight: 800, 
              color: 'var(--color-text-primary)',
              lineHeight: 1.1,
              marginBottom: 'var(--space-6)',
              letterSpacing: '-0.03em'
            }}
          >
            Find Your <span className="gradient-text">Fix</span>
          </h1>
          <p 
            style={{ 
              fontSize: 'var(--text-lg)', 
              color: 'var(--color-text-secondary)', 
              lineHeight: 1.7,
              maxWidth: 600,
              margin: '0 auto var(--space-8)'
            }}
          >
            Most stores group things by "electronics" or "home goods". We group them by the exact pain point they solve. What are you dealing with today?
          </p>
          
          {/* Mock Search Bar */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--color-bg)',
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-6)',
              maxWidth: 500,
              margin: '0 auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
          >
            <span style={{ fontSize: 20, marginRight: 'var(--space-3)' }}>🔍</span>
            <input 
              type="text" 
              placeholder="E.g. back pain at work, can't sleep..." 
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--text-base)',
                width: '100%',
                outline: 'none',
              }}
              disabled
            />
            <button className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)' }}>
              Search
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: 'var(--space-16) 0' }}>
        <div className="container">
          <ProblemCategories />
        </div>
      </div>
    </>
  )
}
