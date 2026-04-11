'use client'

import { useState } from 'react'

interface OrderItem {
  productId: string
  supplierUrl?: string | null
  quantity: number
  priceAtSale: number
}

interface Order {
  id: string
  customerName: string
  customerEmail: string
  status: string
  totalAmount: number
  trackingNumber?: string
  createdAt: string
  items?: OrderItem[]
}

interface OrderQueueProps {
  orders: Order[]
}

export default function OrderQueue({ orders }: OrderQueueProps) {
  const [orderStates, setOrderStates] = useState<Record<string, { status: string; loading: boolean; expanded: boolean }>>({})

  const getState = (id: string) => orderStates[id] || { status: '', loading: false, expanded: false }

  const toggleExpand = (id: string) => {
    setOrderStates(prev => ({
      ...prev,
      [id]: { ...getState(id), expanded: !getState(id).expanded }
    }))
  }

  const handleOpenAutoDS = async (order: Order) => {
    setOrderStates(prev => ({ ...prev, [order.id]: { ...getState(order.id), loading: true } }))

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/fulfill`)
      const data = await res.json()

      // Open CJ Dropshipping manual orders with supplier URL pre-filled (if available)
      const cjUrl = data.items?.[0]?.supplierUrl
        ? `https://app.cjdropshipping.com/order-cart.html`
        : 'https://app.cjdropshipping.com/order-cart.html'
      window.open(cjUrl, '_blank', 'noopener,noreferrer')
    } catch {
      alert('Failed to open CJ Dropshipping. Try going to app.cjdropshipping.com directly.')
    } finally {
      setOrderStates(prev => ({ ...prev, [order.id]: { ...getState(order.id), loading: false } }))
    }
  }

  const handleMarkFulfilled = async (orderId: string) => {
    const tracking = prompt('Enter tracking number (or leave blank):') ?? ''
    setOrderStates(prev => ({ ...prev, [orderId]: { ...getState(orderId), loading: true } }))

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/fulfill`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped', trackingNumber: tracking })
      })
      if (res.ok) {
        setOrderStates(prev => ({ ...prev, [orderId]: { ...getState(orderId), status: 'shipped', loading: false } }))
      }
    } catch {
      alert('Failed to update order status.')
      setOrderStates(prev => ({ ...prev, [orderId]: { ...getState(orderId), loading: false } }))
    }
  }

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'shipped' || s === 'delivered') return '#22c55e'
    if (s === 'processing') return '#f59e0b'
    if (s === 'failed' || s === 'refund') return '#ef4444'
    return '#6b7280'
  }

  return (
    <div style={{ animation: 'fadeIn 0.2s' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Fulfillment Queue</h2>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            Semi-automated — click <strong style={{ color: '#a78bfa' }}>Open in CJ</strong> to place each order, then mark fulfilled.
          </div>
        </div>
        <div style={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#6b7280' }}>
          {orders.length} order{orders.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* How it works banner */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: '1px solid #7c3aed44', borderRadius: 12, padding: '14px 20px', marginBottom: 20, fontSize: 13 }}>
        <div style={{ color: '#a78bfa', fontWeight: 700, marginBottom: 6 }}>⚡ How CJ Dropshipping Fulfillment Works</div>
        <div style={{ color: '#9ca3af', lineHeight: 1.7 }}>
          1. <strong style={{ color: '#e2e8f0' }}>Click "Open in CJ"</strong> — opens CJ Dropshipping order page<br />
          2. <strong style={{ color: '#e2e8f0' }}>Search &amp; add the product</strong>, enter the customer&apos;s address shown below<br />
          3. <strong style={{ color: '#e2e8f0' }}>Confirm the order</strong> in CJ (takes ~30 seconds, uses your CJ balance)<br />
          4. <strong style={{ color: '#e2e8f0' }}>Click "Mark Fulfilled"</strong> here — CJ handles all shipping &amp; tracking ✅
        </div>
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 14, background: '#0d0d1a', borderRadius: 12, border: '1px dashed #1e1e2e' }}>
          🎉 No pending orders. You&apos;re all caught up!
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {orders.map(order => {
            const state = getState(order.id)
            const currentStatus = state.status || order.status
            const isFulfilled = currentStatus === 'shipped' || currentStatus === 'delivered'

            return (
              <div key={order.id} style={{
                background: '#0d0d1a',
                border: `1px solid ${isFulfilled ? '#22c55e33' : '#1e1e2e'}`,
                borderRadius: 12,
                overflow: 'hidden',
                transition: 'border-color 0.3s'
              }}>
                {/* Main row */}
                <div style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>
                        {order.customerName}
                      </p>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
                        background: getStatusColor(currentStatus) + '22',
                        color: getStatusColor(currentStatus)
                      }}>
                        {currentStatus.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
                      {order.customerEmail} · ${order.totalAmount.toFixed(2)} · {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    {order.trackingNumber && (
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#22c55e' }}>📦 {order.trackingNumber}</p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Expand items */}
                    <button
                      onClick={() => toggleExpand(order.id)}
                      style={{ background: 'transparent', border: '1px solid #333', color: '#6b7280', borderRadius: 6, padding: '6px 12px', fontSize: 11, cursor: 'pointer' }}
                    >
                      {state.expanded ? '▲ Hide' : '▼ Items'}
                    </button>

                    {/* Open in CJ Dropshipping */}
                    {!isFulfilled && (
                      <button
                        onClick={() => handleOpenAutoDS(order)}
                        disabled={state.loading}
                        style={{
                          background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                          border: 'none', color: '#fff', borderRadius: 6,
                          padding: '8px 16px', fontSize: 12, fontWeight: 700,
                          cursor: state.loading ? 'wait' : 'pointer', opacity: state.loading ? 0.7 : 1,
                          display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        {state.loading ? '⏳ Loading...' : '📦 Open in CJ ↗'}
                      </button>
                    )}

                    {/* Mark fulfilled */}
                    {!isFulfilled && (
                      <button
                        onClick={() => handleMarkFulfilled(order.id)}
                        disabled={state.loading}
                        style={{
                          background: '#14532d', border: '1px solid #22c55e44', color: '#22c55e',
                          borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 700,
                          cursor: state.loading ? 'wait' : 'pointer'
                        }}
                      >
                        ✅ Mark Fulfilled
                      </button>
                    )}

                    {isFulfilled && (
                      <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 700 }}>✅ Fulfilled</span>
                    )}
                  </div>
                </div>

                {/* Expanded items */}
                {state.expanded && order.items && order.items.length > 0 && (
                  <div style={{ borderTop: '1px solid #1e1e2e', padding: '14px 20px', background: '#080812' }}>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Order Items</div>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #111' }}>
                        <div>
                          <div style={{ fontSize: 12, color: '#e2e8f0' }}>Product ID: {item.productId}</div>
                          {item.supplierUrl && (
                            <a href={item.supplierUrl} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 11, color: '#7c3aed', textDecoration: 'none' }}>
                              🔗 Supplier URL ↗
                            </a>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>Qty: {item.quantity}</div>
                          <div style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>${item.priceAtSale.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
