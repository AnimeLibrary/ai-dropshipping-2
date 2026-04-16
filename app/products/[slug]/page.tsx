import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { SchemaMarkup, productSchema, breadcrumbSchema, faqSchema } from '@/lib/seo/schema'
import ProductGallery from '@/components/commerce/ProductGallery'
import ReviewForm from '@/components/commerce/ReviewForm'
import ProductBuyBox from '@/components/commerce/ProductBuyBox'

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
  const rawProduct = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      variants: {
        orderBy: [{ isDefault: 'desc' }, { cjStock: 'desc' }]
      }
    }
  })

  if (!rawProduct || rawProduct.validationStatus === 'archived') {
    notFound()
  }

  // ── Sanitize shortDescription: never render internal analysis text ──
  // These patterns indicate the AI analysis report leaked into a customer-facing field.
  const INTERNAL_PATTERNS = [
    'guardrail', 'margin', 'saturation', 'APPROVE', 'REVIEW', 'TikTok UGC',
    'fulfillment', 'supplier', 'Niche saturation', 'profit floor', 'markup rule',
  ]
  const rawDesc = rawProduct.shortDescription || ''
  const isInternalData = INTERNAL_PATTERNS.some(p => rawDesc.toLowerCase().includes(p.toLowerCase()))
  const safeDescription = isInternalData || !rawDesc
    ? `Precision-tested for the ${(rawProduct.niche || 'general').replace(/-/g, ' ')} problem. Engineered to actually work — not just look good in an ad.`
    : rawDesc

  // Parse the AI Intel Report stored in longDescription if it exists
  let aiReport: any = null
  try {
    if (rawProduct.longDescription?.startsWith('{')) {
      const parsed = JSON.parse(rawProduct.longDescription)
      // Only use it if it contains the enrichment shape (not the raw analysis report)
      if (parsed?.aiReport || parsed?.generatedReviews) {
        aiReport = parsed
      }
    }
  } catch (e) {}

  // Fetch real reviews from the DB — these are product-specific and user-submitted
  const dbReviews = await prisma.review.findMany({
    where: { productId: rawProduct.id, status: 'approved' },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })

  let galleryImages: string[] = []
  let heroImage = rawProduct.heroImage || '/placeholder.png'
  try {
    if (typeof rawProduct.heroImage === 'string' && rawProduct.heroImage.startsWith('[')) {
      const parsed = JSON.parse(rawProduct.heroImage)
      if (Array.isArray(parsed) && parsed.length > 0) {
        galleryImages = parsed
        heroImage = parsed[0]
      }
    } else if (rawProduct.heroImage) {
      galleryImages = [rawProduct.heroImage]
    }
  } catch (e) {}

  // Map to the format the UI expects
  const product = {
    ...rawProduct,
    price: Number(rawProduct.price),
    compareAtPrice: rawProduct.compareAtPrice ? Number(rawProduct.compareAtPrice) : Number(rawProduct.price) * 1.5,
    heroImage: heroImage,
    galleryImages: galleryImages,
    painNarrative: {
      whyYoureHere: `The ${rawProduct.niche?.replace(/-/g, ' ') || 'product'} problem most people give up solving.`,
      realCause: `Traditional solutions fail because they don't address the root cause. This changes the approach completely.`,
      whyThisWorks: safeDescription,
      whyOthersFail: `Most ${(rawProduct.niche || 'general').replace(/-/g, ' ')} products on the market are optimized for looking good in an ad — not for actually working. They cut corners on materials to hit a low price point, and nobody building them has skin in the game. If it fails you, they've already moved on to the next viral product.`,
    },
    emotionalTrigger: `looking for a solution that actually works — not another disappointment.`,
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

        {/* ── WHY THIS EXISTS ── */}
        <section style={{ padding: 'var(--space-12) 0', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
          <div className="container" style={{ maxWidth: 760 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>

              {/* 01 — The Problem */}
              <div style={{ padding: 'var(--space-5)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-3)' }}>01 — The Problem</p>
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{product.painNarrative.realCause}</p>
              </div>

              {/* 02 — Why Others Fail */}
              <div style={{ padding: 'var(--space-5)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', borderLeft: '3px solid #ef4444' }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-3)' }}>02 — Why Others Fail</p>
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{product.painNarrative.whyOthersFail}</p>
              </div>

              {/* 03 — Why This Works */}
              <div style={{ padding: 'var(--space-5)', background: 'rgba(34,197,94,0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(34,197,94,0.2)', borderLeft: '3px solid var(--color-success)' }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-3)' }}>03 — Why This Works</p>
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{product.painNarrative.whyThisWorks}</p>
              </div>

            </div>
          </div>
        </section>

        {/* ── STAGE 2: Product + Solution ── */}
        <section style={{ padding: 'var(--space-16) 0' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-12)', alignItems: 'start' }}>
              <ProductBuyBox
                product={{
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  compareAtPrice: product.compareAtPrice,
                  heroImage: product.heroImage,
                  galleryImages: product.galleryImages,
                  stripePriceId: product.stripePriceId || null,
                  shortDescription: product.painNarrative.whyThisWorks,
                  slug: product.slug,
                  niche: product.niche,
                }}
                variants={rawProduct.variants.map(v => ({
                  id: v.id,
                  vid: v.vid,
                  label: v.label,
                  color: v.color || null,
                  size: v.size || null,
                  retailPrice: v.retailPrice,
                  cjStock: v.cjStock,
                  image: v.image || null,
                  isDefault: v.isDefault,
                  stripeVariantPriceId: v.stripeVariantPriceId || null,
                }))}
              />
            </div>
          </div>
        </section>

        {/* ── STAGE 3: Trust & FAQ ── */}
        <section style={{ padding: 'var(--space-16) 0', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)' }}>
          <div className="container" style={{ maxWidth: 800 }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-6)', textAlign: 'center' }}>
              The Vexsen Guarantee
            </h3>
            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)' }}>We hate internet junk as much as you do. Here is exactly how we protect your purchase.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              <div style={{ background: 'var(--color-bg)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: '1.25rem' }}>📦</span>
                  <p style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Shipping & Tracking</p>
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>Your order enters our fulfillment queue immediately. It ships within 24-72 hours, and you receive a global tracking number so you can watch it arrive.</p>
              </div>
              
              <div style={{ background: 'var(--color-bg)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: '1.25rem' }}>🛡️</span>
                  <p style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Two-Tier Satisfaction Promise</p>
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>Item arrived defective or not at all? <strong style={{ color: 'var(--color-text-primary)' }}>Full refund, no questions.</strong> Item arrived fine but just isn't for you? <strong style={{ color: 'var(--color-text-primary)' }}>We issue store credit</strong> so your money stays working for you. Either way, you don't lose.</p>
                <a href="/policies/refund" style={{ display: 'inline-block', marginTop: '8px', fontSize: 'var(--text-xs)', color: 'var(--color-accent)', fontWeight: 600 }}>Read full refund policy →</a>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-16)', textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
                {dbReviews.length > 0 ? 'Customer Reviews' : 'Be the First to Review'}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
                {dbReviews.length > 0 ? 'Real feedback from verified buyers.' : 'No reviews yet — leave yours below and help others decide.'}
              </p>

              {dbReviews.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                  {dbReviews.map((review, i) => (
                    <div key={review.id} style={{ background: 'var(--color-bg)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {Array.from({ length: 5 }).map((_, si) => (
                            <span key={si} style={{ color: si < review.rating ? '#F59E0B' : 'var(--color-border)', fontSize: '0.9rem' }}>★</span>
                          ))}
                        </div>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Verified Purchase</span>
                      </div>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-3)' }}>
                        &ldquo;{review.body}&rdquo;
                      </p>
                      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {review.authorName}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 'var(--space-10)', background: 'var(--color-bg)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', maxWidth: 480, margin: '0 auto' }}>
                  <p style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>📝</p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                    Got this product? Share your experience below — it helps real people make the right call.
                  </p>
                </div>
              )}
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
