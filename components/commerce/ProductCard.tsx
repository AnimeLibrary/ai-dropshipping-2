'use client'

import Image from 'next/image'
import Link from 'next/link'

interface Product {
  id: string
  slug: string
  title: string
  category?: string | null
  niche: string
  price: number
  compareAtPrice?: number | null
  heroImage: string | any
  shortDescription?: string | null
  trendScore?: number | null
  validationStatus?: string
}

interface Props {
  product: Product
  index?: number
}

export default function ProductCard({ product, index = 0 }: Props) {
  const savings = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null

  const isTrending = product.trendScore && product.trendScore > 80
  const isNew = index < 3

  let displayImage = product.heroImage || '/placeholder.png'
  try {
    if (typeof displayImage === 'string' && displayImage.startsWith('[')) {
      const parsed = JSON.parse(displayImage)
      if (Array.isArray(parsed) && parsed.length > 0) {
        displayImage = parsed[0]
      }
    }
  } catch (e) {}

  return (
    <article
      className="product-card"
      role="listitem"
      style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
    >
      <Link href={`/products/${product.slug}`} tabIndex={-1} aria-hidden="true" style={{ display: 'block' }}>
        <div className="product-card-image" style={{ aspectRatio: '1/1', position: 'relative' }}>
          {displayImage && displayImage !== '/placeholder.png' ? (
            <Image
              src={displayImage}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, var(--color-bg-secondary), var(--color-border))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '3rem'
            }}>
              🛍️
            </div>
          )}

          {/* Status badges */}
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {isTrending && (
              <span style={{
                background: '#dc2626', color: '#fff',
                fontSize: '10px', fontWeight: 800,
                padding: '3px 8px', borderRadius: '999px',
                letterSpacing: '0.06em', textTransform: 'uppercase'
              }}>🔥 Trending</span>
            )}
            {isNew && !isTrending && (
              <span style={{
                background: 'var(--color-accent)', color: '#fff',
                fontSize: '10px', fontWeight: 800,
                padding: '3px 8px', borderRadius: '999px',
                letterSpacing: '0.06em', textTransform: 'uppercase'
              }}>New</span>
            )}
            {savings && savings >= 15 && (
              <span style={{
                background: 'rgba(0,0,0,0.75)', color: '#fff',
                fontSize: '10px', fontWeight: 800,
                padding: '3px 8px', borderRadius: '999px',
                backdropFilter: 'blur(4px)'
              }}>-{savings}%</span>
            )}
          </div>

          {/* Quick Add overlay on hover */}
          <div className="product-card-overlay">
            <span style={{
              background: 'var(--color-accent)', color: '#fff',
              padding: '8px 20px', borderRadius: 'var(--radius-md)',
              fontWeight: 700, fontSize: 'var(--text-sm)'
            }}>
              View Product →
            </span>
          </div>
        </div>
      </Link>

      <div className="product-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Niche tag */}
        <p style={{
          fontSize: '0.7rem', color: 'var(--color-accent)',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          fontWeight: 700, marginBottom: 4
        }}>
          {(product.category || product.niche).replace(/-/g, ' ')}
        </p>

        {/* Title */}
        <h3 style={{ marginBottom: 6 }}>
          <Link
            href={`/products/${product.slug}`}
            style={{
              fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)',
              fontWeight: 700, color: 'var(--color-text-primary)',
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3
            }}
          >
            {product.title}
          </Link>
        </h3>

        {/* Short description */}
        {product.shortDescription && (
          <p style={{
            fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
            lineHeight: 1.5, marginBottom: 10, flex: 1,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>
            {product.shortDescription}
          </p>
        )}

        {/* Stars placeholder */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ color: '#F59E0B', fontSize: '0.75rem' }}>★</span>
          ))}
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>(47+)</span>
        </div>

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{
              fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)',
              fontWeight: 800, color: 'var(--color-text-primary)'
            }}>
              ${product.price.toFixed(2)}
            </span>
            {product.compareAtPrice && (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                ${Number(product.compareAtPrice).toFixed(2)}
              </span>
            )}
          </div>
          <Link
            href={`/products/${product.slug}`}
            className="btn btn-primary btn-sm"
            aria-label={`Buy ${product.title}`}
          >
            Buy
          </Link>
        </div>
      </div>
    </article>
  )
}
