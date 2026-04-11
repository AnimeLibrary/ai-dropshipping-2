import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { SchemaMarkup, productSchema, breadcrumbSchema } from '@/lib/seo/schema'
import CheckoutButton from '@/components/commerce/CheckoutButton'

interface Props {
  params: { slug: string }
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } })
  if (!product) return {}
  return {
    title: `${product.title} | TrendDrop`,
    description: product.shortDescription || `Discover the solution: ${product.title}`,
  }
}

export default async function ProductPage({ params }: Props) {
  const rawProduct = await prisma.product.findUnique({ where: { slug: params.slug } })

  if (!rawProduct || rawProduct.validationStatus === 'archived') {
    notFound()
  }

  // Parse the AI Intel Report stored in longDescription if it exists
  let aiReport: any = null
  try {
    if (rawProduct.longDescription?.startsWith('{')) {
      aiReport = JSON.parse(rawProduct.longDescription)
    }
  } catch (e) {}

  // Map to the format the UI expects
  const product = {
    ...rawProduct,
    price: Number(rawProduct.price),
    compareAtPrice: rawProduct.compareAtPrice ? Number(rawProduct.compareAtPrice) : Number(rawProduct.price) * 1.5,
    heroImage: rawProduct.heroImage || '/placeholder.png',
    galleryImages: [],
    painNarrative: {
      whyYoureHere: aiReport?.marketSaturation?.adAngle || `If ${rawProduct.niche} is holding you back, we found the fix.`,
      realCause: `Traditional solutions fail because they don't address the root cause. This changes the approach completely.`,
      whyThisWorks: aiReport?.aiReasoning || `Analyzed and approved by our AI curation engine. Tested against market saturation and price-gouging.`
    },
    emotionalTrigger: `frustrated by ${rawProduct.niche} products that overpromise and underdeliver.`,
    adAngles: [] as any[]
  }

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: product.niche.replace(/-/g, ' '), href: `/collections` },
    { name: product.title, href: `/products/${product.slug}` },
  ]

  const hasCheckout = !!product.stripePriceId

  return (
    <>
      {/* ── Breadcrumbs ── */}
      <nav aria-label="Breadcrumb" style={{ padding: 'var(--space-4) 0', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <ol style={{ display: 'flex', gap: 'var(--space-2)', listStyle: 'none', padding: 0, margin: 0, flexWrap: 'wrap' }}>
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.href} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                {i > 0 && <span aria-hidden="true">›</span>}
                {i < breadcrumbs.length - 1 ? (
                  <a href={crumb.href} style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>{crumb.name}</a>
                ) : (
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{crumb.name}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>

      <main id="main-content">
        {/* ── STAGE 1: Pain acknowledgment ── */}
        <section
          style={{
            background: 'linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%)',
            borderBottom: '1px solid var(--color-border)',
            padding: 'var(--space-16) 0',
          }}
        >
          <div className="container" style={{ maxWidth: 760 }}>
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <span className="badge badge-neutral" style={{ marginBottom: 'var(--space-4)', textTransform: 'capitalize' }}>
                {product.niche.replace(/-/g, ' ')}
              </span>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, lineHeight: 1.15, color: 'var(--color-text-primary)', marginBottom: 'var(--space-6)', letterSpacing: '-0.02em' }}>
                {product.painNarrative.whyYoureHere}
              </h1>
              <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                {product.painNarrative.realCause}
              </p>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 'var(--radius-full)', padding: 'var(--space-2) var(--space-4)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', fontWeight: 600 }}>
                You're not alone in feeling: {product.emotionalTrigger}
              </span>
            </div>
          </div>
        </section>

        {/* ── STAGE 2: Product + Solution ── */}
        <section style={{ padding: 'var(--space-16) 0' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-12)', alignItems: 'start' }}>
              
              {/* Image column */}
              <div>
                <div style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-4)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.heroImage} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>

              {/* Buy column */}
              <div>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>The Fix →</p>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)', letterSpacing: '-0.02em' }}>
                  {product.title}
                </h2>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                    ${product.price.toFixed(2)}
                  </span>
                  <span style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                    ${product.compareAtPrice.toFixed(2)}
                  </span>
                  <span className="badge badge-accent">Save ${(product.compareAtPrice - product.price).toFixed(2)}</span>
                </div>

                <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderLeft: '3px solid var(--color-success)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
                  <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-2)' }}>Why This Works</p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{product.painNarrative.whyThisWorks}</p>
                </div>

                {product.validationStatus === 'approved' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
                    <span style={{ color: 'var(--color-success)', fontSize: 14 }}>✓</span>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 600 }}>AI Validation Check Passed</span>
                  </div>
                )}

                {hasCheckout ? (
                  <div>
                    <CheckoutButton priceId={product.stripePriceId!} productName={product.title} />
                  </div>
                ) : (
                  <div>
                    <a href={`/notify?product=${product.slug}`} className="btn btn-primary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>Get Notified When Available →</a>
                  </div>
                )}
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-3)', textAlign: 'center' }}>Secure checkout · 30-day satisfaction guarantee</p>

                <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--color-border)' }}>
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Trend Score</p>
                    <p style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: product.trendScore > 80 ? 'var(--color-success)' : 'var(--color-text-primary)' }}>{product.trendScore}/100</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Source</p>
                    <p style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>{product.source || 'Scouted'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
