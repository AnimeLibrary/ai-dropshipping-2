import Link from 'next/link'
import { Product } from '@/lib/data/products'

interface Props {
  products: Product[]
}

export default function TrendingProducts({ products }: Props) {
  return (
    <div>
      {/* Section header */}
      <div
        className="flex-between"
        style={{ marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}
      >
        <div>
          <span className="badge badge-glow" style={{ marginBottom: 'var(--space-3)' }}>
            📈 Trending Now
          </span>
          <h2 className="heading-xl">
            Products Other People Are <span className="gradient-text">Solving Problems With</span>
          </h2>
        </div>
        <Link href="/collections" className="btn btn-secondary hide-mobile" id="trending-view-all">
          View All →
        </Link>
      </div>

      {/* Product Grid */}
      <div className="grid-3" role="list" aria-label="Trending products">
        {products.map((product, i) => (
          <article
            key={product.id}
            className="product-card reveal"
            style={{ animationDelay: `${i * 80}ms` }}
            role="listitem"
          >
            {/* Image placeholder */}
            <div className="product-card-image">
              <div
                className="skeleton"
                style={{ width: '100%', height: '100%', borderRadius: 0 }}
                aria-hidden="true"
              />
              {/* Trend score badge */}
              <div
                style={{
                  position: 'absolute',
                  top: 'var(--space-3)',
                  right: 'var(--space-3)',
                  display: 'flex',
                  gap: 'var(--space-2)',
                }}
              >
                <span className="pipeline-badge trending">
                  🔥 {product.trendScore}
                </span>
                <span className={`pipeline-badge ${product.source}`}>
                  {product.source}
                </span>
              </div>
              {/* Validation status */}
              {product.validationStatus === 'approved' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'var(--space-3)',
                    left: 'var(--space-3)',
                  }}
                >
                  <span
                    style={{
                      background: 'rgba(34,197,94,0.9)',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    ✓ VALIDATED
                  </span>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="product-card-body">
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                  marginBottom: 'var(--space-2)',
                }}
              >
                {product.niche.replace(/-/g, ' ')} · {product.category}
              </p>
              <h3 className="product-card-title">{product.title}</h3>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-4)',
                  lineHeight: 1.5,
                }}
              >
                {product.shortDescription}
              </p>

              {/* Top ad angle */}
              {product.adAngles[0] && (
                <div
                  style={{
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3)',
                    marginBottom: 'var(--space-4)',
                    borderLeft: '3px solid var(--color-accent)',
                  }}
                >
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      marginBottom: 'var(--space-1)',
                      fontWeight: 600,
                    }}
                  >
                    Top Ad Hook ({product.adAngles[0].platform})
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-primary)',
                      fontStyle: 'italic',
                    }}
                  >
                    "{product.adAngles[0].hook}"
                  </p>
                </div>
              )}

              <div className="flex-between">
                <div>
                  <span className="product-card-price">${product.price.toFixed(2)}</span>
                  {product.compareAtPrice && (
                    <span className="product-card-price-original">
                      ${product.compareAtPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <Link
                  href={`/products/${product.slug}`}
                  id={`product-card-${product.id}`}
                  className="btn btn-primary btn-sm"
                >
                  View →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Mobile view all */}
      <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }} className="hide-desktop">
        <Link href="/collections" className="btn btn-secondary" id="trending-view-all-mobile">
          View All Collections →
        </Link>
      </div>
    </div>
  )
}
