'use client'

import { useState } from 'react'

interface Props {
  productId: string
  price: number
}

export default function CheckoutButton({ productId, price }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="btn btn-primary btn-lg"
        style={{ width: '100%', padding: 'var(--space-5)' }}
      >
        {loading ? 'Processing...' : `Buy Now — $${price.toFixed(2)}`}
      </button>
      {error && (
        <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
