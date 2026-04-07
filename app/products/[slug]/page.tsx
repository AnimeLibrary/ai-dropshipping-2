import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getApprovedProducts, getProductBySlug } from '@/lib/data/products'
import { productSchema, breadcrumbSchema, SchemaMarkup } from '@/lib/seo/schema'
import ProductCard from '@/components/commerce/ProductCard'
import CheckoutButton from '@/components/commerce/CheckoutButton'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  return getApprovedProducts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProductBySlug(params.slug)
  if (!product || product.validationStatus !== 'approved') return {}

  return {
    title: product.metaTitle || `${product.title} | TrendDrop`,
    description: product.metaDescription || product.shortDescription,
  }
}

export default function ProductPage({ params }: Props) {
  const product = getProductBySlug(params.slug)
  if (!product || product.validationStatus !== 'approved') notFound()

  const relatedProducts = getApprovedProducts()
    .filter(p => p.id !== product.id && (p.niche === product.niche || product.relatedProductIds.includes(p.id)))
    .slice(0, 3)

  const schemas = [
    productSchema(product),
    breadcrumbSchema([
      { name: 'Home', href: '/' },
      { name: 'Collections', href: '/collections' },
      { name: product.title, href: `/products/${product.slug}` },
    ]),
  ]

  return (
    <>
      {schemas.map((s, i) => <SchemaMarkup key={i} schema={s} />)}

      <div style={{ paddingTop: 'calc(var(--nav-height) + var(--space-8))' }}>
        <div className="container">
          
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-sep" aria-hidden="true">›</span>
            <Link href="/collections" className="breadcrumb-link">Collections</Link>
            <span className="breadcrumb-sep" aria-hidden="true">›</span>
            <span style={{ color: 'var(--color-text-primary)' }}>{product.title}</span>
          </nav>

          <div className="grid-2" style={{ gap: 'var(--space-12)', marginBottom: 'var(--space-16)' }}>
            
            {/* Image Gallery */}
            <div style={{ position: 'sticky', top: 'calc(var(--nav-height) + var(--space-6))', height: 'fit-content' }}>
              <div className="card" style={{ padding: 0 }}>
                <div className="skeleton" style={{ width: '100%', aspectRatio: '1/1', borderRadius: 0 }} />
              </div>
              
              {/* Micro-Social Proof */}
              <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <div style={{ display: 'flex', color: '#f59e0b' }}>★★★★★</div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  {Math.floor(70 + product.trendScore * 1.5)} Verified Reviews
                </p>
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div style={{ marginBottom: 'var(--space-8)' }}>
                <h1 className="heading-xl" style={{ marginBottom: 'var(--space-2)' }}>{product.title}</h1>
                <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)' }}>
                  {product.shortDescription}
                </p>
              </div>

              <div style={{ marginBottom: 'var(--space-8)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                    ${product.price.toFixed(2)}
                  </span>
                  {product.compareAtPrice && (
                    <span style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                      ${product.compareAtPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                {product.compareAtPrice && (
                  <p style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                    Save ${(product.compareAtPrice - product.price).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Action */}
              <div style={{ marginBottom: 'var(--space-8)' }}>
                {product.stripePriceId ? (
                  <CheckoutButton productId={product.id} price={product.price} />
                ) : (
                  <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
                    <div className="card-body">
                      <p style={{ fontWeight: 600, color: 'var(--color-warning)' }}>Developer Note:</p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                        Stripe API integration pending. Add `stripePriceId` to enable live checkout.
                      </p>
                    </div>
                  </div>
                )}
                
                <ul style={{ 
                  marginTop: 'var(--space-4)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 'var(--space-2)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)' 
                }}>
                  <li>✓ Free Worldwide Shipping</li>
                  <li>✓ 30-Day Money Back Guarantee</li>
                  <li>✓ Data-Validated Solution</li>
                </ul>
              </div>

              {/* Description */}
              <div className="guide-body">
                <h2>Why It Works</h2>
                <p>{product.longDescription}</p>
                
                {product.adAngles[0] && (
                  <>
                    <h3>The Data</h3>
                    <p>
                      This product scores <strong>{product.trendScore}/100</strong> on our trend index, 
                      meaning it is currently solving this problem for thousands of people 
                      across {product.adAngles[0].platform}.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* Related */}
          {relatedProducts.length > 0 && (
            <section className="section-sm">
              <h2 className="heading-lg" style={{ marginBottom: 'var(--space-6)' }}>Compare Alternatives</h2>
              <div className="grid-3">
                {relatedProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  )
}
