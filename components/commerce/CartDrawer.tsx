'use client'

import { useState } from 'react'
import { useCart } from '@/lib/context/CartContext'

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, totalCount, subtotal } = useCart()
  const [loading, setLoading] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [promoStatus, setPromoStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')

  if (!isOpen) return null

  const freeShippingThreshold = 60
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 4.95
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal).toFixed(2)

  const finalTotal = Math.max(0, subtotal - discount + shippingFee)

  const applyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoStatus('checking')
    try {
      const res = await fetch(`/api/referral/validate/${promoCode.trim().toUpperCase()}`)
      const data = await res.json()
      if (data.valid) {
        const saved = Math.round(subtotal * 0.15 * 100) / 100
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
    if (items.length === 0) return
    setLoading(true)
    try {
      const payload = {
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId || undefined,
          vid: item.vid || undefined,
          quantity: item.quantity,
          title: item.title,
          variantLabel: item.variantLabel || undefined,
        })),
        referralCode: promoStatus === 'valid' ? promoCode.trim().toUpperCase() : undefined,
      }

      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Checkout failed')
      }
    } catch (e: any) {
      alert(e.message || 'Checkout unavailable. Please try again or contact support.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        onClick={closeCart}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5, 5, 12, 0.75)',
          backdropFilter: 'blur(6px)',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Drawer Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          background: '#0d0d15',
          borderLeft: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '-8px 0 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem' }}>🛍️</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
              Your Bag{' '}
              <span style={{ fontSize: '0.9rem', color: '#a78bfa', fontWeight: 600 }}>
                ({totalCount} {totalCount === 1 ? 'item' : 'items'})
              </span>
            </h3>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Free Shipping Tracker */}
        <div
          style={{
            padding: '12px 24px',
            background: 'rgba(124, 58, 237, 0.06)',
            borderBottom: '1px solid rgba(124, 58, 237, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
            <span style={{ color: progressPercent >= 100 ? '#22c55e' : '#cbd5e1' }}>
              {progressPercent >= 100
                ? '🎉 You unlocked FREE Tracked Shipping!'
                : `Add $${amountToFreeShipping} more for FREE shipping`}
            </span>
            <span style={{ color: '#a78bfa' }}>{progressPercent}%</span>
          </div>
          <div
            style={{
              height: '6px',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: progressPercent >= 100 ? '#22c55e' : 'linear-gradient(90deg, #7c3aed, #ec4899)',
                borderRadius: '999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛒</div>
              <h4 style={{ color: '#f8fafc', fontSize: '1.1rem', marginBottom: '8px' }}>Your cart is empty</h4>
              <p style={{ fontSize: '0.85rem', marginBottom: '24px', lineHeight: 1.6 }}>
                Explore our problem-solving curated items and find your new daily favorite.
              </p>
              <button
                onClick={closeCart}
                className="btn btn-primary"
                style={{ padding: '8px 24px', fontSize: '0.9rem' }}
              >
                Browse Products →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {items.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    alignItems: 'center',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#161622',
                      flexShrink: 0,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        📦
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5
                      style={{
                        margin: '0 0 4px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#f8fafc',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </h5>

                    {/* Variant badge */}
                    {item.variantLabel && (
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '11px',
                          color: '#c4b5fd',
                          background: 'rgba(124, 58, 237, 0.15)',
                          padding: '1px 7px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          marginBottom: '6px',
                        }}
                      >
                        {item.variantLabel}
                      </span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      {/* Price */}
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
                        ${(item.price * item.quantity).toFixed(2)}{' '}
                        {item.quantity > 1 && (
                          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>
                            (${item.price.toFixed(2)} ea)
                          </span>
                        )}
                      </span>

                      {/* Stepper + Delete */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: '#161622',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                          }}
                        >
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              padding: '2px 8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                            }}
                          >
                            -
                          </button>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff', minWidth: '18px', textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              padding: '2px 8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                            }}
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          title="Remove item"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: '4px',
                            fontSize: '13px',
                            lineHeight: 1,
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <div
            style={{
              padding: '20px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#090910',
            }}
          >
            {/* Promo Code Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Promo code"
                value={promoCode}
                onChange={e => {
                  setPromoCode(e.target.value.toUpperCase())
                  setPromoStatus('idle')
                  setDiscount(0)
                }}
                onKeyDown={e => e.key === 'Enter' && applyPromo()}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: '#141420',
                  border: `1px solid ${promoStatus === 'valid' ? '#22c55e' : promoStatus === 'invalid' ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <button
                onClick={applyPromo}
                disabled={promoStatus === 'checking' || !promoCode.trim()}
                style={{
                  background: 'rgba(124, 58, 237, 0.2)',
                  border: '1px solid rgba(124, 58, 237, 0.4)',
                  color: '#c4b5fd',
                  borderRadius: '6px',
                  padding: '0 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {promoStatus === 'checking' ? '...' : 'Apply'}
              </button>
            </div>

            {/* Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Subtotal</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>${subtotal.toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22c55e', fontWeight: 600 }}>
                  <span>Referral Discount (15%)</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Tracked Shipping</span>
                <span style={{ color: shippingFee === 0 ? '#22c55e' : '#fff', fontWeight: 600 }}>
                  {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#fff',
                }}
              >
                <span>Estimated Total</span>
                <span style={{ color: '#a78bfa', fontSize: '17px' }}>${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 0.8s linear infinite', width: 18, height: 18 }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Redirecting to Checkout...
                </>
              ) : (
                <>⚡ Checkout Now ({totalCount} {totalCount === 1 ? 'item' : 'items'})</>
              )}
            </button>

            {/* Badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px', fontSize: '11px', color: '#64748b' }}>
              <span>🔒 256-Bit SSL Checkout</span>
              <span>•</span>
              <span>🚚 Inspected & Tracked</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
