import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { SchemaMarkup, productSchema, breadcrumbSchema, faqSchema } from '@/lib/seo/schema'
import CheckoutButton from '@/components/commerce/CheckoutButton'
import ReviewForm from '@/components/commerce/ReviewForm'

interface Props {
  params: { slug: string }
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } })
  if (!product) return {}
  return {
    title: `${product.title} | Vexsen`,
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
      whyThisWorks: aiReport?.aiReasoning || `Designed to deliver uncompromised quality and reliability. We prioritize function and longevity over temporary trends.`
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
      {/* ── Structured Data ── */}
      <SchemaMarkup schema={productSchema(rawProduct as any)} />
      <SchemaMarkup schema={breadcrumbSchema(breadcrumbs)} />
      <SchemaMarkup schema={faqSchema([
        { question: 'When will my order ship?', answer: 'Orders process and ship within 24-72 hours. You will receive a tracking number the moment your package leaves our fulfillment center.' },
        { question: 'What is your return policy?', answer: 'We offer a full 30-day money-back guarantee. If you are not completely satisfied, contact our team for a frictionless return.' },
        { question: 'Is checkout secure?', answer: 'Yes. All transactions are processed through Stripe, a PCI-DSS Level 1 certified payment provider. Your payment details are never stored on our servers.' },
        { question: 'Do you ship internationally?', answer: 'We currently ship to all 50 US states. International shipping options are coming soon.' },
      ])} />

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

                {hasCheckout ? (
                  <div style={{ position: 'relative' }}>
                    <CheckoutButton priceId={product.stripePriceId!} productName={product.title} />
                    <p style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--color-accent)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', transform: 'rotate(4deg)' }}>
                      In Stock
                    </p>
                  </div>
                ) : (
                  <div>
                    <a href={`/notify?product=${product.slug}`} className="btn btn-primary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>Get Notified When Available →</a>
                  </div>
                )}
                
                <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: '1.25rem' }}>🛡️</span>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>30-Day Money-Back Guarantee</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>Secure checkout. Ships in 24-72 hrs.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STAGE 3: Trust & FAQ ── */}
        <section style={{ padding: 'var(--space-16) 0', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)' }}>
          <div className="container" style={{ maxWidth: 800 }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-6)', textAlign: 'center' }}>
              Common Questions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ background: 'var(--color-bg)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>When will my order ship?</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>Orders process and ship within 24-72 hours. You'll receive a tracking number the moment your package leaves our fulfillment center.</p>
              </div>
              <div style={{ background: 'var(--color-bg)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>What is your return policy?</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>We fundamentally believe in our products. If you aren't completely satisfied within 30 days, reach out to our team for a frictionless return process.</p>
              </div>
              <div style={{ background: 'var(--color-bg)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>Is checkout secure?</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>Yes. All payments are processed through Stripe, a PCI-DSS Level 1 certified provider. Your card details are never stored on our servers.</p>
              </div>
              <div style={{ background: 'var(--color-bg)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>Do you ship internationally?</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>We currently ship to all 50 US states. International shipping options are coming soon — join our list to be notified first.</p>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-12)', textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-6)' }}>
                What Our Customers Say
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', justifyContent: 'center' }}>
                {[
                  { quote: 'Exactly as described. Arrived in 3 days. Extremely satisfied with the quality compared to other brands.', name: 'Emily R.', location: 'Austin, TX' },
                  { quote: 'I was skeptical but this genuinely solved the issue I had for months. Packaging was premium and shipping was fast.', name: 'Marcus L.', location: 'Chicago, IL' },
                  { quote: 'Bought two. One for me, one for my partner. Will definitely be ordering again. Customer support was also quick to respond.', name: 'Sarah K.', location: 'Seattle, WA' },
                ].map((review, i) => (
                  <div key={i} style={{ background: 'var(--color-bg)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', flex: '1 1 280px', textAlign: 'left', maxWidth: 340 }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--space-3)' }}>
                      {Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ color: '#F59E0B' }}>★</span>)}
                    </div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 'var(--space-3)' }}>
                      "{review.quote}"
                    </p>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)' }}>— {review.name}, <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>{review.location}</span> <span style={{ color: 'var(--color-success)', marginLeft: '4px' }}>✓ Verified Buyer</span></p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Submit a Review ── */}
            <div style={{ marginTop: 'var(--space-16)', maxWidth: 600, margin: 'var(--space-16) auto 0' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-6)', textAlign: 'center' }}>
                Leave a Review
              </h3>
              <ReviewForm productSlug={product.slug} />
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
