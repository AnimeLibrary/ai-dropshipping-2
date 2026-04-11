import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { generateGuideContent } from '@/lib/content/generator'
import { faqSchema, articleSchema, breadcrumbSchema, SchemaMarkup } from '@/lib/seo/schema'
import ProductCard from '@/components/commerce/ProductCard'
import StickyCTA from '@/components/commerce/StickyCTA'
import BundleShowcase from '@/components/commerce/BundleShowcase'

interface Props {
  params: { slug: string }
}

// Generate all guide pages at build time
export async function generateStaticParams() {
  const clusters = await prisma.keywordCluster.findMany({
    where: { targetPageType: 'guide' },
    select: { targetSlug: true }
  })
  return clusters.map((c: any) => ({ slug: c.targetSlug }))
}

// Dynamic metadata per guide
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cluster = await prisma.keywordCluster.findUnique({
    where: { targetSlug: params.slug }
  })

  if (!cluster) return {}
  const content = generateGuideContent(cluster as any)
  return {
    title: content.metaTitle,
    description: content.metaDescription,
  }
}

export default async function GuidePage({ params }: Props) {
  const cluster = await prisma.keywordCluster.findUnique({
    where: { 
      targetSlug: params.slug,
      targetPageType: 'guide'
    },
    include: {
      products: {
        where: { validationStatus: 'approved' },
        include: {
          bundles: {
            where: { status: 'approved' },
            include: { products: true },
            take: 1
          }
        },
        take: 3
      }
    }
  })

  if (!cluster) notFound()

  const content = generateGuideContent(cluster as any)
  const relatedProducts = cluster.products
  const featuredBundle = (relatedProducts[0] as any)?.bundles?.[0]

  const schemas = [
    articleSchema({ title: content.h1, description: content.metaDescription, slug: params.slug, section: 'guides' }),
    faqSchema(content.faq),
    breadcrumbSchema([
      { name: 'Home', href: '/' },
      { name: 'Guides', href: '/guides' },
      { name: content.h1, href: `/guides/${params.slug}` },
    ]),
  ]
// ... [Remaining UI code stays the same]


  return (
    <>
      {schemas.map((s, i) => <SchemaMarkup key={i} schema={s} />)}

      <div style={{ paddingTop: 'var(--nav-height)' }}>
        <div className="container section">

          {/* Breadcrumbs */}
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-sep" aria-hidden="true">›</span>
            <Link href="/guides" className="breadcrumb-link">Guides</Link>
            <span className="breadcrumb-sep" aria-hidden="true">›</span>
            <span style={{ color: 'var(--color-text-primary)' }}>{content.h1}</span>
          </nav>

          <div className="guide-layout">
            {/* Main Content */}
            <article className="guide-body">
              {/* Meta */}
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
                <span className="badge badge-neutral">{cluster.niche.replace(/-/g, ' ')}</span>
                {cluster.trend === 'rising' && <span className="badge badge-accent">📈 Rising Trend</span>}
                <span className="badge badge-neutral" style={{ textTransform: 'none', letterSpacing: 0 }}>
                  {cluster.searchVolume.toLocaleString()} searches/mo
                </span>
              </div>

              {/* H1 */}
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                marginBottom: 'var(--space-6)',
              }}>
                {content.h1}
              </h1>

              <p style={{
                fontSize: 'var(--text-xl)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                marginBottom: 'var(--space-10)',
                borderLeft: '4px solid var(--color-accent)',
                paddingLeft: 'var(--space-5)',
              }}>
                {content.heroSubline}
              </p>

              {/* Content Sections */}
              {content.sections.map((section, i) => (
                <div key={i} style={{ marginBottom: 'var(--space-10)' }}>
                  {section.heading && <h2>{section.heading}</h2>}
                  <p>{section.body}</p>

                  {/* Inject bundling right after the problem analysis */}
                  {section.type === 'problem' && featuredBundle && (
                    <BundleShowcase bundle={featuredBundle} />
                  )}

                  {/* Inject related products in product-pitch section */}
                  {section.type === 'product-pitch' && relatedProducts.length > 0 && (
                    <div className="grid-2" style={{ marginTop: 'var(--space-6)' }}>
                      {relatedProducts.map((p) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Internal Links */}
              {content.internalLinks.length > 0 && (
                <div style={{
                  background: 'var(--color-bg-secondary)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-6)',
                  marginBottom: 'var(--space-10)',
                }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                    Related Guides
                  </h3>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {content.internalLinks.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-accent)',
                          fontWeight: 500,
                          transition: 'opacity var(--transition-fast)',
                        }}>
                          → {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* FAQ */}
              <h2>Frequently Asked Questions</h2>
              <div>
                {content.faq.map((faq, i) => (
                  <div key={i} style={{
                    borderBottom: '1px solid var(--color-border-soft)',
                    paddingBottom: 'var(--space-5)',
                    marginBottom: 'var(--space-5)',
                  }}>
                    <h3 style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 600,
                      marginBottom: 'var(--space-2)',
                    }}>
                      {faq.question}
                    </h3>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: 'var(--text-base)' }}>
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            {/* Sidebar */}
            <aside className="guide-sidebar">
              <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                <div className="card-body">
                  <p style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: 'var(--text-base)',
                    marginBottom: 'var(--space-2)',
                  }}>
                    Ready to solve this?
                  </p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                    Browse products validated for this exact problem.
                  </p>
                  <Link href="/collections" className="btn btn-primary" style={{ width: '100%' }}>
                    Shop Solutions →
                  </Link>
                </div>
              </div>

              {/* Related niches */}
              <div className="card">
                <div className="card-body">
                  <p style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                    marginBottom: 'var(--space-4)',
                  }}>
                    This Guide
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Search Volume</span>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{cluster.searchVolume.toLocaleString()}/mo</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Competition</span>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, textTransform: 'capitalize', color: cluster.competition === 'low' ? 'var(--color-success)' : 'inherit' }}>{cluster.competition}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Trend</span>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, textTransform: 'capitalize' }}>{cluster.trend}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Source</span>
                      <span className={`pipeline-badge ${cluster.source}`}>{cluster.source}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <StickyCTA 
          productTitle={relatedProducts[0].title} 
          price={relatedProducts[0].price} 
          slug={relatedProducts[0].slug} 
        />
      )}
    </>
  )
}
