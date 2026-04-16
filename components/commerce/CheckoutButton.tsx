'use client'

import { useState } from 'react'

interface CheckoutButtonProps {
  productId: string
  title: string
  price: number
  imageUrl?: string
  bundleItems?: string[]
  variant?: 'primary' | 'outline'
  className?: string
  priceId?: string
  productName?: string
}

export default function CheckoutButton({
  productId,
  title,
  price,
  imageUrl,
  bundleItems,
  variant = 'primary',
  className = '',
  priceId,
  productName,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoStatus, setPromoStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [discount, setDiscount] = useState(0)
  const [showPromo, setShowPromo] = useState(false)

  const resolvedTitle = productName || title || 'Product'
  const finalPrice = discount > 0 ? Math.round((price - discount) * 100) / 100 : price

  const applyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoStatus('checking')
    try {
      const res = await fetch(`/api/referral/validate/${promoCode.trim().toUpperCase()}`)
      const data = await res.json()
      if (data.valid) {
        const saved = Math.round(price * 0.15 * 100) / 100
        setDiscount(saved)
        setPromoStatus('valid')
      } else {
        setDiscount(0)
        setPromoStatus('invalid')
      }
    } catch {
      setPromoStatus('invalid')
    }
  }

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          title: resolvedTitle,
          price,
          priceId,
          imageUrl,
          bundleItems,
          referralCode: promoStatus === 'valid' ? promoCode.trim().toUpperCase() : undefined,
        })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Checkout failed')
      }
    } catch (e) {
      alert('Checkout unavailable. Please try again or contact support.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Buy Button */}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`btn btn-primary btn-lg ${className}`}
        style={{ width: '100%', position: 'relative' }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <svg style={{ animation: 'spin 0.8s linear infinite', width: 18, height: 18 }} fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Redirecting to checkout...
          </span>
        ) : (
          <>
            ⚡ {bundleItems ? 'Claim This Bundle' : `Buy Now${discount > 0 ? ` — $${finalPrice.toFixed(2)}` : ''}`}
          </>
        )}
      </button>

      {/* Promo Code Toggle */}
      <div style={{ marginTop: 'var(--space-3)' }}>
        {!showPromo ? (
          <button
            onClick={() => setShowPromo(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
              textDecoration: 'underline', padding: 0, fontFamily: 'var(--font-body)'
            }}
          >
            Have a referral / promo code?
          </button>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'stretch' }}>
              <input
                type="text"
                placeholder="Enter promo code…"
                value={promoCode}
                onChange={e => {
                  setPromoCode(e.target.value.toUpperCase())
                  setPromoStatus('idle')
                  setDiscount(0)
                }}
                onKeyDown={e => e.key === 'Enter' && applyPromo()}
                style={{
                  flex: 1, padding: '10px 14px',
                  border: `1px solid ${promoStatus === 'valid' ? 'var(--color-success)' : promoStatus === 'invalid' ? '#ef4444' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)', background: 'var(--color-bg)',
                  color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-mono)', outline: 'none', letterSpacing: '0.05em'
                }}
              />
              <button
                onClick={applyPromo}
                disabled={promoStatus === 'checking' || !promoCode.trim()}
                className="btn btn-secondary btn-sm"
                style={{ whiteSpace: 'nowrap' }}
              >
                {promoStatus === 'checking' ? '...' : 'Apply'}
              </button>
            </div>

            {promoStatus === 'valid' && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 700, marginTop: 6 }}>
                ✓ Code applied — 15% off! You save ${discount.toFixed(2)}
              </p>
            )}
            {promoStatus === 'invalid' && (
              <p style={{ fontSize: 'var(--text-xs)', color: '#ef4444', marginTop: 6 }}>
                ✗ Invalid code. Check your referral link and try again.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
