'use client'

import { useEffect, useState } from 'react'

type Product = {
  id: string
  title: string
  niche: string
  price: number
  supplierPrice: number
  trendScore: number
  cjProductId: string | null
  cjVariants: any | null
  validationStatus: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = async () => {
    // We would ideally fetch from a real GET endpoint, but since we are doing this quickly:
    // we'll mock a fetch or you'd use a server action. 
    // Here we'll create a simple API route internally if needed or assume we hook up a standard GET route.
    const res = await fetch('/api/admin/products')
    if (res.ok) {
      const data = await res.json()
      setProducts(data.products)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const enrichProduct = async (id: string, keyword: string) => {
    const res = await fetch('/api/admin/products/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id, keyword }),
    })
    if (res.ok) {
      alert('Product enriched with CJ Variants.')
      fetchProducts()
    } else {
      const data = await res.json()
      alert('Error: ' + data.error)
    }
  }

  const setStatus = async (id: string, status: string) => {
    const res = await fetch('/api/admin/products/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id, status }),
    })
    if (res.ok) {
      fetchProducts()
    } else {
      const data = await res.json()
      alert('Error: ' + data.error)
    }
  }

  if (loading) return <div className="container" style={{ padding: '40px 0' }}>Loading AI products...</div>

  return (
    <div className="container" style={{ padding: '60px 0' }}>
      <h1 style={{ marginBottom: '24px' }}>Validate AI Product Picks</h1>
      {products.length === 0 ? (
        <p>No products waiting for validation.</p>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {products.map((p) => (
            <div key={p.id} style={{ 
              border: '1px solid var(--color-border)', 
              padding: '24px', 
              borderRadius: '8px', 
              background: 'var(--color-bg-secondary)' 
            }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{p.title}</h2>
              <p><strong>Niche:</strong> {p.niche} | <strong>Sell Price:</strong> ${p.price} | <strong>Cost:</strong> ${p.supplierPrice}</p>
              <p style={{ marginBottom: '16px' }}><strong>Status:</strong> {p.validationStatus}</p>

              <p style={{ marginBottom: '16px', color: p.cjProductId ? 'green' : 'var(--color-text-secondary)' }}>
                CJ ID: {p.cjProductId || 'Missing'} | Variants: {p.cjVariants ? p.cjVariants.length : 0}
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn btn-outline" 
                  onClick={() => enrichProduct(p.id, p.title)}
                >
                  Auto-fetch CJ Details
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ background: 'green', borderColor: 'green' }}
                  onClick={() => setStatus(p.id, 'approved')}
                >
                  Approve
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ background: 'red', borderColor: 'red' }}
                  onClick={() => setStatus(p.id, 'rejected')}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
