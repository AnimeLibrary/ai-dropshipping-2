'use client'

import { useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
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
  const { user, isLoaded } = useUser()
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase()
  const isAdmin = isLoaded && (userEmail === 'brannenguidry28@gmail.com' || (user?.publicMetadata as any)?.role === 'admin')

  const [localVariants, setLocalVariants] = useState<Variant[]>(variants)
  const defaultVariant = localVariants.find(v => v.isDefault) || localVariants[0] || null

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(defaultVariant)
  const [selectedColor, setSelectedColor] = useState<string | null>(defaultVariant?.color || null)
  const [selectedSize, setSelectedSize] = useState<string | null>(defaultVariant?.size || null)
  const [quantity, setQuantity] = useState<number>(1)

  // Admin editing state
  const [adminTab, setAdminTab] = useState<'none' | 'price' | 'title' | 'desc'>('none')
  
  // Price
  const [inputPrice, setInputPrice] = useState(product.price.toString())
  const [savingPrice, setSavingPrice] = useState(false)
  const [basePrice, setBasePrice] = useState(product.price)
  const [baseCompareAt, setBaseCompareAt] = useState(product.compareAtPrice)

  // Title
  const [currentTitle, setCurrentTitle] = useState(product.title)
  const [inputTitle, setInputTitle] = useState(product.title)
  const [savingTitle, setSavingTitle] = useState(false)

  // Description
  const [currentDesc, setCurrentDesc] = useState(product.shortDescription || '')
  const [inputDesc, setInputDesc] = useState(product.shortDescription || '')
  const [savingDesc, setSavingDesc] = useState(false)

  const hasVariants = localVariants.length > 1
  const colors = uniqueColors(localVariants)
  const sizes = uniqueSizes(localVariants)

  // When color or size selection changes, find the matching variant
  const selectVariant = useCallback((color: string | null, size: string | null) => {
    const match = localVariants.find(v =>
      (color === null || v.color === color) &&
      (size === null || v.size === size)
    ) || localVariants[0]
    setSelectedVariant(match)
  }, [localVariants])

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    selectVariant(color, selectedSize)
  }

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size)
    selectVariant(selectedColor, size)
  }

  const handleAdminPriceSave = async () => {
    const val = parseFloat(inputPrice)
    if (isNaN(val) || val <= 0) return alert('Please enter a valid price.')
    setSavingPrice(true)
    try {
      const newCompare = Math.round(val * 1.4 * 100) / 100
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: val,
          compareAtPrice: newCompare
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update price')
      setBasePrice(val)
      setBaseCompareAt(newCompare)
      setLocalVariants(prev => prev.map(v => ({ ...v, retailPrice: val })))
      if (selectedVariant) {
        setSelectedVariant({ ...selectedVariant, retailPrice: val })
      }
      setAdminTab('none')
    } catch (err: any) {
      alert(err.message || 'Error updating price')
    } finally {
      setSavingPrice(false)
    }
  }

  const handleAdminTitleSave = async () => {
    const trimmed = inputTitle.trim()
    if (!trimmed) return alert('Title cannot be empty.')
    setSavingTitle(true)
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update title')
      setCurrentTitle(trimmed)
      setAdminTab('none')
    } catch (err: any) {
      alert(err.message || 'Error updating title')
    } finally {
      setSavingTitle(false)
    }
  }

  const handleAdminDescSave = async () => {
    const trimmed = inputDesc.trim()
    setSavingDesc(true)
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortDescription: trimmed })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update description')
      setCurrentDesc(trimmed)
      setAdminTab('none')
    } catch (err: any) {
      alert(err.message || 'Error updating description')
    } finally {
      setSavingDesc(false)
    }
  }

  // Determine active price + stripe ID based on selected variant
  const activePrice = selectedVariant ? selectedVariant.retailPrice : basePrice
  const activeStripePriceId = selectedVariant?.stripeVariantPriceId || product.stripePriceId
  const hasCheckout = !!activeStripePriceId
  const lowStock = selectedVariant && selectedVariant.cjStock > 0 && selectedVariant.cjStock < 10
  const outOfStock = selectedVariant && selectedVariant.cjStock < 0

  // Gallery: use variant image as first if available, then product gallery
  const variantImage = selectedVariant?.image
  const gallery = variantImage
    ? [variantImage, ...product.galleryImages.filter(img => img !== variantImage)]
    : product.galleryImages

  const compareAt = baseCompareAt || activePrice * 1.5
  const savings = Math.max(0, compareAt - activePrice).toFixed(2)

  return (
    <>
      {/* ── Image column ── */}
      <div style={{ transition: 'opacity 0.2s ease' }}>
        <ProductGallery images={gallery.length > 0 ? gallery : [product.heroImage]} title={currentTitle} />
      </div>

      {/* ── Buy column ── */}
      <div>
        {/* Admin Quick Editor Suite */}
        {isAdmin && (
          <div style={{
            background: '#12121e',
            border: '1px solid #7c3aed66',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: adminTab !== 'none' ? 10 : 0 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
                🛡️ Admin Quick-Edit
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setAdminTab(adminTab === 'price' ? 'none' : 'price')}
                  style={{
                    background: adminTab === 'price' ? '#7c3aed' : '#7c3aed22',
                    border: '1px solid #7c3aed66',
                    color: adminTab === 'price' ? '#fff' : '#c4b5fd',
                    borderRadius: 5,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  💵 Price (${activePrice.toFixed(2)})
                </button>
                <button
                  onClick={() => setAdminTab(adminTab === 'title' ? 'none' : 'title')}
                  style={{
                    background: adminTab === 'title' ? '#7c3aed' : '#7c3aed22',
                    border: '1px solid #7c3aed66',
                    color: adminTab === 'title' ? '#fff' : '#c4b5fd',
                    borderRadius: 5,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  📝 Title
                </button>
                <button
                  onClick={() => setAdminTab(adminTab === 'desc' ? 'none' : 'desc')}
                  style={{
                    background: adminTab === 'desc' ? '#7c3aed' : '#7c3aed22',
                    border: '1px solid #7c3aed66',
                    color: adminTab === 'desc' ? '#fff' : '#c4b5fd',
                    borderRadius: 5,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  📄 Description
                </button>
              </div>
            </div>

            {/* Price Tab Form */}
            {adminTab === 'price' && (
              <div style={{ paddingTop: 8, borderTop: '1px solid #7c3aed33', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Retail Price: $</span>
                <input
                  type="number"
                  step="0.01"
                  value={inputPrice}
                  onChange={e => setInputPrice(e.target.value)}
                  style={{ width: 90, background: '#0a0a0f', border: '1px solid #7c3aed', color: '#fff', borderRadius: 4, padding: '4px 8px', fontSize: 13, fontWeight: 700, outline: 'none' }}
                />
                <button
                  onClick={handleAdminPriceSave}
                  disabled={savingPrice}
                  style={{ background: '#22c55e', border: 'none', color: '#fff', borderRadius: 4, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  {savingPrice ? 'Saving…' : 'Save Price'}
                </button>
                <button
                  onClick={() => setAdminTab('none')}
                  style={{ background: 'transparent', border: '1px solid #4a4a6a', color: '#94a3b8', borderRadius: 4, padding: '5px 8px', fontSize: 11, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Title Tab Form */}
            {adminTab === 'title' && (
              <div style={{ paddingTop: 8, borderTop: '1px solid #7c3aed33', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Product Title:</label>
                <input
                  type="text"
                  value={inputTitle}
                  onChange={e => setInputTitle(e.target.value)}
                  style={{ width: '100%', background: '#0a0a0f', border: '1px solid #7c3aed', color: '#fff', borderRadius: 6, padding: '6px 10px', fontSize: 13, fontWeight: 600, outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setAdminTab('none')}
                    style={{ background: 'transparent', border: '1px solid #4a4a6a', color: '#94a3b8', borderRadius: 4, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdminTitleSave}
                    disabled={savingTitle}
                    style={{ background: '#22c55e', border: 'none', color: '#fff', borderRadius: 4, padding: '5px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {savingTitle ? 'Saving…' : 'Save Title'}
                  </button>
                </div>
              </div>
            )}

            {/* Description Tab Form */}
            {adminTab === 'desc' && (
              <div style={{ paddingTop: 8, borderTop: '1px solid #7c3aed33', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Product Description / Blurb:</label>
                <textarea
                  rows={3}
                  value={inputDesc}
                  onChange={e => setInputDesc(e.target.value)}
                  style={{ width: '100%', background: '#0a0a0f', border: '1px solid #7c3aed', color: '#fff', borderRadius: 6, padding: '8px 10px', fontSize: 13, lineHeight: 1.4, outline: 'none', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setAdminTab('none')}
                    style={{ background: 'transparent', border: '1px solid #4a4a6a', color: '#94a3b8', borderRadius: 4, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdminDescSave}
                    disabled={savingDesc}
                    style={{ background: '#22c55e', border: 'none', color: '#fff', borderRadius: 4, padding: '5px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {savingDesc ? 'Saving…' : 'Save Description'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>
          Verified Product →
        </p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)', letterSpacing: '-0.02em' }}>
          {currentTitle}
        </h2>

        {currentDesc && (
          <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
            {currentDesc}
          </p>
        )}

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

        {/* Quantity Breaks / Bundle Tiers */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-2)' }}>
            Select Quantity & Bundle Savings:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { q: 1, label: 'Buy 1', tag: 'Standard', discount: 0 },
              { q: 2, label: 'Buy 2', tag: 'Popular (15% OFF)', discount: 0.15 },
              { q: 3, label: 'Buy 3', tag: 'Best Value (25% OFF)', discount: 0.25 },
            ].map(tier => {
              const unitPrice = activePrice * (1 - tier.discount)
              const totalPrice = unitPrice * tier.q
              const isSelected = quantity === tier.q
              return (
                <button
                  key={tier.q}
                  onClick={() => setQuantity(tier.q)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                    background: isSelected ? 'rgba(124,58,237,0.08)' : 'var(--color-bg-secondary)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
                    {tier.label}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    ${totalPrice.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: tier.discount > 0 ? 'var(--color-success)' : 'var(--color-text-muted)', marginTop: 3 }}>
                    {tier.tag}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        {hasCheckout && !outOfStock ? (
          <div style={{ position: 'relative', marginTop: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: 'var(--text-xs)', fontWeight: 700, color: '#b45309', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 'var(--radius-full)', padding: '3px 10px' }}>
                🔥 Selling fast this week
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-success)' }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--color-success)', flexShrink: 0 }} />
                ✓ Inspected & Tracked Delivery (7–12 Business Days)
              </span>
            </div>
            <CheckoutButton
              productId={product.id}
              title={`${product.title}${selectedVariant && !selectedVariant.isDefault ? ` — ${selectedVariant.label}` : ''}`}
              price={activePrice}
              quantity={quantity}
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
