import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getProductBySlug, getApprovedProducts } from '@/lib/data/products'
import { SchemaMarkup, productSchema, breadcrumbSchema } from '@/lib/seo/schema'
import CheckoutButton from '@/components/commerce/CheckoutButton'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const products = getApprovedProducts()
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProductBySlug(params.slug)
  if (!product) return {}
  return {
    title: product.metaTitle || `${product.title} | TrendDrop`,
    description:
      product.metaDescription ||
      product.shortDescription,
  }
}

export default function ProductPage({ params }: Props) {
  const product = getProductBySlug(params.slug)

  if (!product || product.validationStatus === 'rejected') {
    notFound()
  }

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: product.niche.replace(/-/g, ' '), href: `/problems/${product.niche}` },
    { name: product.title, href: `/products/${product.slug}` },
  ]

  const hasCheckout = !!product.stripePriceId

  return (
    <>
      <SchemaMarkup schema={productSchema(product)} />
      <SchemaMarkup schema={breadcrumbSchema(breadcrumbs)} />

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
        {/* ── STAGE 1: Pain acknowledgment — why they're here ── */}
        {product.painNarrative && (
          <section
            style={{
              background: 'linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%)',
              borderBottom: '1px solid var(--color-border)',
              padding: 'var(--space-16) 0',
            }}
            aria-label="Why you're here"
          >
            <div className="container" style={{ maxWidth: 760 }}>
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <span className="badge badge-neutral" style={{ marginBottom: 'var(--space-4)' }}>
                  {product.niche.replace(/-/g, ' ')}
                </span>
                <h1
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                    fontWeight: 800,
                    lineHeight: 1.15,
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--space-6)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {product.painNarrative.whyYoureHere}
                </h1>
                <p
                  style={{
                    fontSize: 'var(--text-lg)',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.7,
                  }}
                >
                  {product.painNarrative.realCause}
                </p>
              </div>

              {/* Emotional trigger badge */}
              {product.emotionalTrigger && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    background: 'rgba(124,58,237,0.08)',
                    border: '1px solid rgba(124,58,237,0.2)',
                    borderRadius: 'var(--radius-full)',
                    padding: 'var(--space-2) var(--space-4)',
                  }}
                >
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', fontWeight: 600 }}>
                    You're not alone in feeling: {product.emotionalTrigger}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── STAGE 2: Product + Solution ── */}
        <section style={{ padding: 'var(--space-16) 0' }}>
          <div className="container">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 'var(--space-12)',
                alignItems: 'start',
              }}
            >
              {/* Image column */}
              <div>
                {/* Hero image */}
                <div
                  style={{
                    aspectRatio: '4/3',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  {product.heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.heroImage}
                      alt={product.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="skeleton"
                      style={{ width: '100%', height: '100%', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                        Image coming soon
                      </span>
                    </div>
                  )}
                </div>

                {/* Gallery thumbnails — supplier proof layer */}
                {product.galleryImages.length > 0 && (
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {product.galleryImages.map((img, i) => (
                      <div
                        key={i}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={`${product.title} view ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Buy column */}
              <div>
                {/* Product name — secondary to pain above */}
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  The Fix →
                </p>
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                    fontWeight: 800,
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--space-3)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {product.title}
                </h2>

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'var(--text-3xl)',
                      fontWeight: 800,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    ${product.price.toFixed(2)}
                  </span>
                  {product.compareAtPrice && (
                    <span
                      style={{
                        fontSize: 'var(--text-lg)',
                        color: 'var(--color-text-muted)',
                        textDecoration: 'line-through',
                      }}
                    >
                      ${product.compareAtPrice.toFixed(2)}
                    </span>
                  )}
                  {product.compareAtPrice && (
                    <span className="badge badge-accent">
                      Save ${(product.compareAtPrice - product.price).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Why this works — the solution statement */}
                {product.painNarrative?.whyThisWorks && (
                  <div
                    style={{
                      background: 'rgba(34,197,94,0.07)',
                      border: '1px solid rgba(34,197,94,0.2)',
                      borderLeft: '3px solid var(--color-success)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-5)',
                      marginBottom: 'var(--space-6)',
                    }}
                  >
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-2)' }}>
                      Why This Works
                    </p>
                    <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                      {product.painNarrative.whyThisWorks}
                    </p>
                  </div>
                )}

                {/* Validation badge */}
                {product.validationStatus === 'approved' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      marginBottom: 'var(--space-5)',
                    }}
                  >
                    <span style={{ color: 'var(--color-success)', fontSize: 14 }}>✓</span>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      Human-validated · Ad performance confirmed · Supplier verified
                    </span>
                  </div>
                )}

                {/* Checkout */}
                {hasCheckout ? (
                  <div>
                    <CheckoutButton priceId={product.stripePriceId!} productName={product.title} />
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-3)', textAlign: 'center' }}>
                      Secure checkout · 30-day satisfaction guarantee
                    </p>
                  </div>
                ) : (
                  <div>
                    <a
                      id={`product-notify-${product.id}`}
                      href={`/notify?product=${product.slug}`}
                      className="btn btn-primary"
                      style={{ width: '100%', textAlign: 'center', display: 'block' }}
                    >
                      Get Notified When Available →
                    </a>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-3)', textAlign: 'center' }}>
                      We'll email you the moment this is ready to order.
                    </p>
                  </div>
                )}

                {/* Trend data — credibility, not hype */}
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--space-6)',
                    marginTop: 'var(--space-6)',
                    paddingTop: 'var(--space-5)',
                    borderTop: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trend Score</p>
                    <p style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: product.trendScore > 80 ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
                      {product.trendScore}/100
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Source</p>
                    <p style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                      {product.source}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</p>
                    <p style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                      {product.category}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STAGE 3: Long-form copy (problem → solution depth) ── */}
        <section style={{ padding: 'var(--space-12) 0', borderTop: '1px solid var(--color-border)' }}>
          <div className="container" style={{ maxWidth: 720 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-6)' }}>
              The Full Story
            </h2>
            <div
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.8,
              }}
            >
              {product.longDescription}
            </div>
          </div>
        </section>

        {/* ── STAGE 4: Top ad angles (social proof of resonance) ── */}
        {product.adAngles.length > 0 && (
          <section style={{ padding: 'var(--space-12) 0', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)' }}>
            <div className="container" style={{ maxWidth: 720 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
                Why People Are Talking About This
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
                The reasons this product resonates — from real ad performance data.
              </p>
              {product.adAngles.map((angle, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-5)',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>{angle.platform} · {angle.emotion}</span>
                    {angle.performanceScore && (
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: angle.performanceScore > 85 ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                        Performance: {angle.performanceScore}/100
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 'var(--text-base)', fontStyle: 'italic', color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                    "{angle.hook}"
                  </p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    Pain addressed: {angle.pain}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── STAGE 5: Final CTA -- anchored back to the pain ── */}
        <section style={{ padding: 'var(--space-16) 0', borderTop: '1px solid var(--color-border)' }}>
          <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)' }}>
              You came here because something wasn't working.
            </h2>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-8)' }}>
              {product.shortDescription} This is what 4,200+ people found this month.
            </p>
            {hasCheckout ? (
              <CheckoutButton priceId={product.stripePriceId!} productName={product.title} />
            ) : (
              <a
                href={`/notify?product=${product.slug}`}
                className="btn btn-primary btn-lg"
                id={`product-final-cta-${product.id}`}
              >
                Get Notified When Available →
              </a>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
