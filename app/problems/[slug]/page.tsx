import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const title = params.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return {
    title: `${title} Solutions | Vexsen`,
    description: `Expert-curated products to solve ${title.toLowerCase()} permanently. Stop buying temporary fixes.`,
  }
}

export default async function ProblemCategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  
  // Find products that match this niche/problem area
  const products = await prisma.product.findMany({
    where: { 
      validationStatus: 'approved',
      niche: { contains: slug.replace(/-/g, ' ') }
    },
    take: 10,
  })

  const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return (
    <main style={{ paddingTop: 'var(--nav-height)' }}>
      {/* Dynamic SEO Hero */}
      <section style={{ padding: 'var(--space-16) 0', background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 800 }}>
          <span className="badge badge-neutral" style={{ marginBottom: 'var(--space-4)' }}>Diagnostic Category</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)', lineHeight: 1.1 }}>
            How to fix <span className="gradient-text">{title}</span>.
          </h1>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-8)' }}>
            We tested the most viral solutions for {title.toLowerCase()}. Most failed. These are the ones that actually worked, formulated into a permanent fix.
          </p>
        </div>
      </section>

      {/* Programmatic Product Grid */}
      <section className="container section">
        {products.length > 0 ? (
          <div className="grid-3">
            {products.map(p => (
              <Link key={p.id} href={`/products/${p.slug}`} className="product-card">
                <div className="product-card-image">
                  {p.heroImage ? (
                    <img src={p.heroImage} alt={p.title} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--color-border-soft)' }} />
                  )}
                  <div className="product-card-overlay">
                    <span className="btn btn-primary btn-sm">View Solution</span>
                  </div>
                </div>
                <div className="product-card-body">
                  <h3 className="product-card-title">{p.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span className="product-card-price">${p.price.toFixed(2)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
            <span style={{ fontSize: '3rem', marginBottom: 'var(--space-4)', display: 'block' }}>🔍</span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Curating new solutions...
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)', maxWidth: 400, margin: '0 auto var(--space-6)' }}>
              Our AI is currently sourcing and validating the best products to solve {title.toLowerCase()}. Check back soon.
            </p>
            <Link href="/collections" className="btn btn-primary">
              View All Proven Products
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
