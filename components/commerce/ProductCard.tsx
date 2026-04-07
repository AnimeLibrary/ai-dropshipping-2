import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/lib/data/products'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  return (
    <article className="product-card" role="listitem">
      <Link href={`/products/${product.slug}`} tabIndex={-1} aria-hidden="true">
        <div className="product-card-image">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 0 }} />
          )}

          {/* Validation Badge */}
          {product.validationStatus === 'approved' && (
            <div
              style={{
                position: 'absolute',
                top: 'var(--space-3)',
                left: 'var(--space-3)',
                background: 'rgba(34,197,94,0.9)',
                color: 'white',
                fontSize: '10px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '999px',
                letterSpacing: '0.05em',
                backdropFilter: 'blur(4px)'
              }}
            >
              ✓ VALIDATED
            </div>
          )}
        </div>
      </Link>

      <div className="product-card-body">
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
            marginBottom: 'var(--space-2)'
          }}
        >
          {product.category}
        </p>

        <h3 className="product-card-title">
          <Link href={`/products/${product.slug}`}>
            {product.title}
          </Link>
        </h3>

        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-4)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {product.shortDescription}
        </p>

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
            className="btn btn-primary btn-sm"
            aria-label={`View ${product.title}`}
          >
            View Details →
          </Link>
        </div>
      </div>
    </article>
  )
}
