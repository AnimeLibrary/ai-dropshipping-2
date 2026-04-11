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
}

/**
 * SURGICAL CHECKOUT BUTTON
 * High-conversion trigger that initiates the Stripe Checkout flow.
 */
export default function CheckoutButton({ 
  productId, 
  title, 
  price, 
  imageUrl, 
  bundleItems,
  variant = 'primary',
  className = ''
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, title, price, imageUrl, bundleItems })
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

  const baseStyles = "px-8 py-4 rounded-xl font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 "
  const variantStyles = variant === 'primary' 
    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-purple-500/20"
    : "border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10"

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={baseStyles + variantStyles + " " + className}
    >
      {loading ? (
        <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Redirecting...
        </span>
      ) : (
        <>
            ⚡ {bundleItems ? 'Claim This Bundle' : 'Get Solution Now'}
        </>
      )}
    </button>
  )
}
