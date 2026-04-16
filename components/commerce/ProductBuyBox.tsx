'use client'

import { useState, useCallback } from 'react'
import CheckoutButton from '@/components/commerce/CheckoutButton'
import ProductGallery from '@/components/commerce/ProductGallery'

interface Variant {
  id: string
  vid: string
  label: string
  color: string | null
  size: string | null
  retailPrice: number
  cjStock: number
  image: string | null
  isDefault: boolean
  stripeVariantPriceId: string | null
}

interface ProductData {
  id: string
  title: string
  price: number
  compareAtPrice: number
  heroImage: string
  galleryImages: string[]
  stripePriceId: string | null
  shortDescription: string
  slug: string
  niche: string
}

interface Props {
  product: ProductData
  variants: Variant[]
}

// Deduplicate color values for swatch rendering
function uniqueColors(variants: Variant[]): string[] {
  const seen = new Set<string>()
  return variants.filter(v => v.color && !seen.has(v.color!) && seen.add(v.color!)).map(v => v.color!)
}

function uniqueSizes(variants: Variant[]): string[] {
  const seen = new Set<string>()
  return variants.filter(v => v.size && !seen.has(v.size!) && seen.add(v.size!)).map(v => v.size!)
}

const CSS_COLOR_MAP: Record<string, string> = {
  'black': '#1a1a1a', 'white': '#f5f5f5', 'red': '#e53e3e', 'blue': '#3182ce',
  'green': '#38a169', 'yellow': '#d69e2e', 'pink': '#d53f8c', 'purple': '#805ad5',
  'orange': '#dd6b20', 'gray': '#718096', 'grey': '#718096', 'brown': '#92400e',
  'navy': '#1a365d', 'beige': '#c5a880', 'khaki': '#a08020',
}

function getSwatchColor(colorName: string): string {
  return CSS_COLOR_MAP[colorName.toLowerCase()] || '#888'
}

export default function ProductBuyBox({ product, variants }: Props) {
  const defaultVariant = variants.find(v => v.isDefault) || variants[0] || null

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(defaultVariant)
  const [selectedColor, setSelectedColor] = useState<string | null>(defaultVariant?.color || null)
  const [selectedSize, setSelectedSize] = useState<string | null>(defaultVariant?.size || null)

  const hasVariants = variants.length > 1
  const colors = uniqueColors(variants)
  const sizes = uniqueSizes(variants)

  // When color or size selection changes, find the matching variant
  const selectVariant = useCallback((color: string | null, size: string | null) => {
    const match = variants.find(v =>
      (color === null || v.color === color) &&
      (size === null || v.size === size)
    ) || variants[0]
    setSelectedVariant(match)
  }, [variants])

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    selectVariant(color, selectedSize)
  }

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size)
    selectVariant(selectedColor, size)
  }

  // Determine active price + stripe ID based on selected variant
  const activePrice = selectedVariant ? selectedVariant.retailPrice : product.price
  const activeStripePriceId = selectedVariant?.stripeVariantPriceId || product.stripePriceId
  const hasCheckout = !!activeStripePriceId
  const lowStock = selectedVariant && selectedVariant.cjStock > 0 && selectedVariant.cjStock < 10
  // Only treat as out-of-stock if CJ explicitly returns negative stock (discontinued variant).
  // cjStock === 0 means "not yet synced from CJ" — do NOT block checkout on unsynced stock.
  const outOfStock = selectedVariant && selectedVariant.cjStock < 0

  // Gallery: use variant image as first if available, then product gallery
  const variantImage = selectedVariant?.image
  const gallery = variantImage
    ? [variantImage, ...product.galleryImages.filter(img => img !== variantImage)]
    : product.galleryImages

  const compareAt = product.compareAtPrice || activePrice * 1.5
  const savings = (compareAt - activePrice).toFixed(2)

  return (
    <>
      {/* ── Image column ── */}
      <div style={{ transition: 'opacity 0.2s ease' }}>
        <ProductGallery images={gallery.length > 0 ? gallery : [product.heroImage]} title={product.title} />
      </div>

      {/* ── Buy column ── */}
      <div>
        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>
          The Fix →
        </p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)', letterSpacing: '-0.02em' }}>
          {product.title}
        </h2>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-text-primary)', transition: 'all 0.2s ease' }}>
            ${activePrice.toFixed(2)}
          </span>
          <span style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
            ${compareAt.toFixed(2)}
          </span>
          <span className="badge badge-accent">Save ${savings}</span>
        </div>

        {/* ── VARIANT SELECTOR ── */}
        {hasVariants && (
          <div style={{ marginBottom: 'var(--space-5)' }}>

            {/* Color Swatches */}
            {colors.length > 0 && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-2)' }}>
                  Color: <span style={{ color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>{selectedColor || 'Select'}</span>
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      title={color}
                      style={{
                        width: 32, height: 32,
                        borderRadius: '50%',
                        background: getSwatchColor(color),
                        border: selectedColor === color ? '3px solid var(--color-accent)' : '2px solid var(--color-border)',
                        cursor: 'pointer',
                        outline: selectedColor === color ? '2px solid rgba(124,58,237,0.3)' : 'none',
                        outlineOffset: 2,
                        transition: 'all 0.15s ease',
                        boxShadow: selectedColor === color ? '0 0 0 3px rgba(124,58,237,0.2)' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Buttons */}
            {sizes.length > 0 && (
              <div>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-2)' }}>
                  Size: <span style={{ color: 'var(--color-text-primary)' }}>{selectedSize || 'Select'}</span>
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {sizes.map(size => {
                    const variantForSize = variants.find(v =>
                      v.size === size && (selectedColor === null || v.color === selectedColor)
                    )
                    const inStock = !variantForSize || variantForSize.cjStock !== 0
                    return (
                      <button
                        key={size}
                        onClick={() => inStock && handleSizeSelect(size)}
                        disabled={!inStock}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: selectedSize === size ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                          background: selectedSize === size ? 'rgba(124,58,237,0.1)' : 'var(--color-bg-secondary)',
                          color: !inStock ? 'var(--color-text-muted)' : selectedSize === size ? 'var(--color-accent)' : 'var(--color-text-primary)',
                          fontWeight: selectedSize === size ? 700 : 500,
                          fontSize: 'var(--text-sm)',
                          cursor: inStock ? 'pointer' : 'not-allowed',
                          opacity: !inStock ? 0.5 : 1,
                          textDecoration: !inStock ? 'line-through' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Selected variant label + stock */}
            {selectedVariant && (
              <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  Selected: <strong style={{ color: 'var(--color-text-primary)' }}>{selectedVariant.label}</strong>
                </span>
                {outOfStock ? (
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 999 }}>
                    Out of stock
                  </span>
                ) : lowStock ? (
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 999 }}>
                    Only {selectedVariant.cjStock} left!
                  </span>
                ) : (
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-success)', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 999 }}>
                    ✓ In stock
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Why This Works */}
        <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderLeft: '3px solid var(--color-success)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-2)' }}>Why This Works</p>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{product.shortDescription}</p>
        </div>

        {/* CTA */}
        {hasCheckout && !outOfStock ? (
          <div style={{ position: 'relative', marginTop: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: 'var(--text-xs)', fontWeight: 700, color: '#b45309', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 'var(--radius-full)', padding: '3px 10px' }}>
                🔥 Selling fast this week
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-success)' }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--color-success)', flexShrink: 0 }} />
                Ships within 24 hrs
              </span>
            </div>
            <CheckoutButton
              productId={product.id}
              title={`${product.title}${selectedVariant && !selectedVariant.isDefault ? ` — ${selectedVariant.label}` : ''}`}
              price={activePrice}
              imageUrl={variantImage || product.heroImage || undefined}
              priceId={activeStripePriceId || undefined}
            />
            <p style={{ position: 'absolute', top: '40px', right: '-10px', background: 'var(--color-accent)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', transform: 'rotate(4deg)' }}>
              Limited Batch
            </p>
          </div>
        ) : outOfStock ? (
          <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p style={{ fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>This variant is out of stock</p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Try selecting a different size or color above.</p>
          </div>
        ) : (
          <div style={{ marginTop: 'var(--space-6)' }}>
            <a href={`/notify?product=${product.slug}`} className="btn btn-primary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
              Get Notified When Available →
            </a>
          </div>
        )}

        {/* Trust block */}
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '12px', padding: 'var(--space-4)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          {[
            { icon: '🛡️', title: '100% Satisfaction — Guaranteed', sub: 'Full refund if defective. Store credit if you just aren\'t happy.' },
            { icon: '🚚', title: 'Fast & Tracked Shipping', sub: null },
            { icon: '🔒', title: 'Secure Encrypted Checkout', sub: null },
          ].map((item, i) => (
            <div key={i}>
              {i > 0 && <div style={{ width: '100%', height: '1px', background: 'var(--color-border)', marginBottom: '12px' }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{item.title}</p>
                  {item.sub && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>{item.sub}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
