'use client'

import { useState } from 'react'
import AdminChat from '@/components/admin/AdminChat'
import AnalyticsGrid from '@/components/admin/AnalyticsGrid'
import { transformKalodataToProduct, KalodataRow } from '@/lib/data/kalodata-importer'
import { proposeTripleBundles, BundleProposal } from '@/lib/ai/bundle-strategist'
import { StripeService } from '@/lib/services/stripe-service'
import { MineaImporter } from '@/lib/services/minea-importer'
import { AdStrategist, AdAngleProposal } from '@/lib/ai/ad-strategist'

// ============================================================
// ADMIN COMMAND CENTER
// ============================================================

interface Supplier {
  id: string
  name: string
  url: string
  price: number
  rating: number
  shippingDays: number
  isReliable: boolean
  isCheapest: boolean
}

interface AdminProduct {
  id: string
  title: string
  niche: string
  trendScore: number
  source: string
  price: number
  supplierPrice: number
  suppliers: Supplier[]
  validationStatus: string
  validationNotes?: string
  emotionalTrigger?: string
  painNarrative?: {
    whyYoureHere: string
    realCause: string
    whyThisWorks: string
  }
  adAngles: Array<{
    hook: string
    pain: string
    emotion: string
    platform: string
    performanceScore?: number
  }>
  statusTrends?: {
    ctr: number
    conversion: number
    profit: number
  }
  stockCount?: number
}

// Simulated data
const MOCK_PENDING: AdminProduct[] = [
  {
    id: 'weighted-calm-blanket',
    title: 'WeightedCalm Blanket',
    niche: 'sleep',
    trendScore: 91,
    source: 'minea',
    price: 79.99,
    supplierPrice: 22.00,
    suppliers: [
      { id: 'ali-2', name: 'AliExpress Direct', url: '#', price: 21.50, rating: 4.6, shippingDays: 14, isReliable: true, isCheapest: true }
    ],
    validationStatus: 'pending',
    validationNotes: 'Verify supplier MOQ and shipping time before approving',
    emotionalTrigger: 'exhaustion from years of broken, anxious sleep',
    painNarrative: {
      whyYoureHere: "It's late. You're exhausted — genuinely, bone-tired exhausted. But the moment you lie down your mind starts running.",
      realCause: "Anxiety keeps your nervous system locked in fight-or-flight mode even when your body is still.",
      whyThisWorks: "Deep-touch pressure — the same signal as a firm hug — physically activates your parasympathetic nervous system.",
    },
    adAngles: [
      { hook: "I haven't slept properly in 3 years. Until I tried this.", pain: 'Chronic sleep deprivation from anxiety', emotion: 'hope', platform: 'tiktok', performanceScore: 92 },
    ],
    statusTrends: { ctr: 4.5, conversion: 1.8, profit: 5600 },
  },
]

const MOCK_APPROVED: AdminProduct[] = [
  {
    id: 'lumbar-pro-cushion',
    title: 'LumbarPro Support Cushion',
    niche: 'back-pain',
    trendScore: 82,
    source: 'kalodata',
    price: 34.99,
    supplierPrice: 11.50,
    suppliers: [
      { id: 'ali-1', name: 'AliExpress Direct', url: '#', price: 11.50, rating: 4.8, shippingDays: 12, isReliable: true, isCheapest: true }
    ],
    validationStatus: 'approved',
    emotionalTrigger: 'fear of permanent back damage from years of poor posture',
    adAngles: [],
    statusTrends: { ctr: 3.2, conversion: 2.1, profit: 4200 },
  },
]

type Panel = 'pending' | 'analysis' | 'queue' | 'analytics' | 'bundles' | 'orders' | 'refunds'

interface Order {
  id: string
  customer: string
  items: string[]
  total: number
  status: 'processing' | 'shipped' | 'failed' | 'cancelled' | 'flagged_for_refund'
  supplierUrl: string
  trackingNumber?: string
  refundReason?: string
}

export default function AdminPage() {
  const [pending, setPending] = useState<AdminProduct[]>(MOCK_PENDING)
  const [approved, setApproved] = useState<AdminProduct[]>(MOCK_APPROVED)
  const [queued, setQueued] = useState<AdminProduct[]>([])
  const [selected, setSelected] = useState<AdminProduct | null>(MOCK_PENDING[0] || null)
  const [activePanel, setActivePanel] = useState<Panel>('analysis')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [proposedBundles, setProposedBundles] = useState<BundleProposal[]>([])
  const [orders, setOrders] = useState<Order[]>([
    { id: 'ORD-7721', customer: 'Brannen G.', items: ['WeightedCalm Blanket'], total: 79.99, status: 'processing', supplierUrl: '#' },
    { id: 'ORD-7722', customer: 'Alice S.', items: ['LumbarPro Cushion'], total: 34.99, status: 'shipped', supplierUrl: '#', trackingNumber: 'LX123456789CN' },
    { id: 'ORD-8801', customer: 'David L.', items: ['ZenMist Humidifier'], total: 49.99, status: 'flagged_for_refund', supplierUrl: '#', refundReason: 'OOS: Supplier stock hit 0 during fulfillment check.' },
  ])
  const [automationEnabled, setAutomationEnabled] = useState(true)
  const adStrategist = new AdStrategist()

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const callStatusApi = async (id: string, action: 'approve' | 'queue' | 'reject') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      })
      if (!res.ok) throw new Error('Failed')
      return true
    } catch (e) {
      showToast('Unexpected error', 'error')
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (product: AdminProduct) => {
    const ok = await callStatusApi(product.id, 'approve')
    if (!ok) return
    setPending((prev) => prev.filter((p) => p.id !== product.id))
    setApproved((prev) => [...prev, { ...product, validationStatus: 'approved' }])
    setSelected(null)
    showToast(`✓ Approved: ${product.title}`)
  }

  const handleReject = async (product: AdminProduct) => {
    const ok = await callStatusApi(product.id, 'reject')
    if (!ok) return
    setPending((prev) => prev.filter((p) => p.id !== product.id))
    setSelected(null)
    showToast(`Rejected: ${product.title}`, 'error')
  }

  const handleQueueForPublish = async (product: AdminProduct) => {
    const ok = await callStatusApi(product.id, 'queue')
    if (!ok) return
    setQueued((prev) => [...prev, { ...product, validationStatus: 'queuedForPublish' }])
    showToast(`📤 Queued: ${product.title}`)
  }

  const handlePublishBatch = async () => {
    setLoading(true)
    showToast("🚀 Syncing batch to Stripe...", "success")
    const stripe = new StripeService()
    
    try {
      for (const product of queued) {
        const result = await stripe.syncProduct({
            id: product.id,
            title: product.title,
            price: product.price
        })
        if (!result.success) {
            showToast(`Sync failed for ${product.title}`, "error")
        }
      }
      showToast(`Successfully published ${queued.length} items to Stripe!`, "success")
      setQueued([]) // Clear queue after success
    } catch (e) {
      showToast("Batch sync failed", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleMineaImport = async () => {
    showToast("Opening Minea Ad-Spy CSV Parser...", "success")
    const minea = new MineaImporter()
    
    // Simulating analyzing a new product from a Minea link
    if (selected) {
        const strategy = await adStrategist.proposeStrategy(selected.title, { platform: 'tiktok', score: 94 })
        setPending(prev => prev.map(p => p.id === selected.id ? { ...p, adStrategy: strategy } : p))
        showToast("Minea Ad Angle Captured!", "success")
    }
  }

  const handleBulkImport = () => {
  // In a real scenario, this would trigger a file input
  }

  const handleAutoScout = async () => {
    setLoading(true)
    showToast("🔍 AI is scouting Kalodata (Top 5 Pages)...", "success")
    try {
      const res = await fetch('/api/admin/scout', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setPending(prev => [...prev, ...data.products])
        showToast(`Surgical Scout complete! Found ${data.count} candidates.`, "success")
        
        // Auto-propose bundles if we have enough products
        const bundles = proposeTripleBundles([...approved, ...data.products] as any)
        setProposedBundles(bundles)
      }
    } catch (e) {
      showToast("Scout failed. Check ZenRows API key.", "error")
    } finally {
      setLoading(false)
    }
  }

  const statusColor: Record<string, string> = {
    pending: '#f59e0b',
    approved: '#22c55e',
    queuedForPublish: '#7c3aed',
    rejected: '#ef4444',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0c0c0f', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: 'rgba(30,30,46,0.9)', border: `1px solid ${toast.type === 'success' ? '#22c55e' : '#ef4444'}`, borderRadius: 8, padding: '12px 20px', color: '#fff', fontSize: 14 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: '1px solid #1e1e2e', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#a78bfa' }}>⚡ TrendDrop Command Center</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button 
            onClick={handleAutoScout}
            disabled={loading}
            style={{ 
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', 
              border: 'none', 
              borderRadius: 6, 
              padding: '6px 14px', 
              color: 'white', 
              fontSize: 12, 
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Scouting...' : '🚀 Auto-Scout (Top 5 Pages)'}
          </button>
          <div style={{ width: 1, height: 24, background: '#1e1e2e', margin: '0 8px' }} />
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#6b7280' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.1)', padding: '4px 10px', borderRadius: 20, border: '1px solid #22c55e33' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: automationEnabled ? '#22c55e' : '#6b7280' }} />
                <span style={{ fontSize: 11, color: automationEnabled ? '#4ade80' : '#6b7280', fontWeight: 700 }}>{automationEnabled ? 'AUTO-ORDER ON' : 'AUTO-ORDER OFF'}</span>
                <button onClick={() => setAutomationEnabled(!automationEnabled)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', textDecoration: 'underline' }}>Toggle</button>
            </div>
            <div style={{ width: 1, height: 24, background: '#1e1e2e', margin: '0 8px' }} />
            <span>⏳ Pending: {pending.length}</span>
            <span>✓ Approved: {approved.length}</span>
            <button onClick={() => setIsChatOpen(!isChatOpen)} style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid #7c3aed66', borderRadius: 6, padding: '4px 12px', color: '#c4b5fd', cursor: 'pointer' }}>💬 AI Strategist</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 260px', height: 'calc(100vh - 57px)' }}>
        
        {/* Left: Feed */}
        <div style={{ borderRight: '1px solid #1e1e2e', overflow: 'auto', background: '#0f0f15' }}>
          <div style={{ padding: 12, borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#4a4a6a' }}>PENDING REVIEW</span>
            <button 
              onClick={handleBulkImport}
              style={{ background: '#7c3aed22', border: '1px solid #7c3aed44', color: '#a78bfa', fontSize: 10, padding: '2px 6px', borderRadius: 4, cursor: 'pointer' }}
            >
              + Bulk Import
            </button>
          </div>
          {pending.map((p) => (
            <button key={p.id} onClick={() => { setSelected(p); setActivePanel('analysis') }} style={{ width: '100%', textAlign: 'left', padding: 16, background: selected?.id === p.id ? 'rgba(124,58,237,0.05)' : 'transparent', border: 'none', borderBottom: '1px solid #1e1e2e', cursor: 'pointer' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{p.title}</p>
              <p style={{ fontSize: 11, color: '#6b7280' }}>{p.niche} · Score: {p.trendScore}</p>
            </button>
          ))}
          
          <div style={{ padding: 12, borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activePanel === 'orders' ? 'rgba(34,197,94,0.05)' : 'transparent' }}>
            <button onClick={() => setActivePanel('orders')} style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 700, color: activePanel === 'orders' ? '#4ade80' : '#4a4a6a', cursor: 'pointer' }}>📦 LIVE ORDERS ({orders.length})</button>
          </div>

          <div style={{ padding: 12, borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activePanel === 'refunds' ? 'rgba(239,68,68,0.1)' : 'transparent' }}>
            <button onClick={() => setActivePanel('refunds')} style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 700, color: activePanel === 'refunds' ? '#ef4444' : '#4a4a6a', cursor: 'pointer' }}>⚠️ ACTION REQUIRED ({orders.filter(o => o.status === 'flagged_for_refund').length})</button>
          </div>

          <div style={{ padding: 12, borderBottom: '1px solid #1e1e2e', fontSize: 11, fontWeight: 700, color: '#4a4a6a', marginTop: 10 }}>APPROVED</div>
          {approved.map((p) => (
            <div key={p.id} style={{ padding: 12, borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12 }}>{p.title}</span>
              <button onClick={() => handleQueueForPublish(p)} style={{ fontSize: 10, background: '#1e1e2e', border: '1px solid #333', color: '#ccc', borderRadius: 4, padding: '2px 6px' }}>+ Queue</button>
            </div>
          ))}
        </div>

        {/* Center: Analysis */}
        <div style={{ overflow: 'auto', padding: 32 }}>
          {!selected ? (
            <div style={{ textAlign: 'center', paddingTop: 80, color: '#4a4a6a' }}>Select a product to inspect</div>
          ) : (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{selected.title}</h1>
                <p style={{ color: '#6b7280', fontSize: 14 }}>
                  ${selected.price.toFixed(2)} · {selected.niche} 
                  {selected.stockCount !== undefined && (
                    <span style={{ marginLeft: 12, color: selected.stockCount < 20 ? '#ef4444' : '#22c55e', fontWeight: 800 }}>
                      📦 Stock: {selected.stockCount}
                    </span>
                  )}
                </p>
                <div style={{ display: 'flex', gap: 20, marginTop: 16, borderBottom: '1px solid #1e1e2e' }}>
                  {['analysis', 'analytics', 'bundles', 'ads'].map(t => (
                    <button key={t} onClick={() => setActivePanel(t as Panel)} style={{ padding: '8px 0', background: 'transparent', border: 'none', borderBottom: activePanel === t ? '2px solid #7c3aed' : '2px solid transparent', color: activePanel === t ? '#fff' : '#666', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{t}</button>
                  ))}
                </div>
              </div>

              {activePanel === 'bundles' && (
                <div style={{ animation: 'fadeIn 0.2s' }}>
                  <p style={{ fontSize: 11, color: '#4a4a6a', fontWeight: 800, marginBottom: 16 }}>AI-PROPOSED TRIPLE THREAT BUNDLES</p>
                  {proposedBundles.length === 0 ? (
                    <div style={{ padding: 40, border: '2px dashed #1e1e2e', borderRadius: 12, textAlign: 'center', color: '#4a4a6a' }}>
                      <p style={{ fontSize: 24, marginBottom: 8 }}>🍱</p>
                      <p>Run <b>Auto-Scout</b> or Approve more products to generate bundles.</p>
                    </div>
                  ) : (
                    proposedBundles.map((b, i) => (
                      <div key={i} style={{ background: '#141420', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24, marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: 18, color: '#a78bfa' }}>{b.title}</h3>
                            <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0' }}>{b.hook}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#4ade80' }}>${b.targetPrice.toFixed(2)}</p>
                            <p style={{ margin: 0, fontSize: 12, color: '#6b7280', textDecoration: 'line-through' }}>${b.totalIndividualPrice.toFixed(2)}</p>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
                          {b.products.map(p => (
                            <div key={p.id} style={{ background: '#0c0c0f', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                              <img src={p.heroImage} alt={p.title} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 4, marginBottom: 8 }} />
                              <p style={{ fontSize: 11, fontWeight: 600, margin: 0 }}>{p.title}</p>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                          <button onClick={handleBulkImport} style={{ flex: 1, padding: '10px', background: '#1e1e2e', border: '1px solid #333', borderRadius: 8, color: '#aaa', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                              📂 Kalodata CSV
                          </button>
                          <button onClick={handleMineaImport} style={{ flex: 1, padding: '10px', background: 'rgba(124,58,237,0.1)', border: '1px solid #7c3aed66', borderRadius: 8, color: '#c4b5fd', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                              🎭 Minea Deep-Spy
                          </button>
                        </div>
                        <button style={{ width: '100%', marginTop: 20, padding: 10, background: 'rgba(124,58,237,0.1)', border: '1px solid #7c3aed66', borderRadius: 8, color: '#c4b5fd', fontWeight: 700, cursor: 'pointer' }}>
                          Approve Triple Bundle
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activePanel === 'analytics' && selected.statusTrends && (
                <div style={{ animation: 'fadeIn 0.2s' }}>
                  <AnalyticsGrid stats={selected.statusTrends} />
                  <div style={{ marginTop: 32, background: '#141420', padding: 20, borderRadius: 12, border: '1px solid #1e1e2e' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span>Supplier Cost:</span><span>${selected.supplierPrice.toFixed(2)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span>Retail Price:</span><span>${selected.price.toFixed(2)}</span></div>
                    <div style={{ height: 1, background: '#1e1e2e', margin: '12px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80', fontWeight: 700 }}><span>Est. Net Profit:</span><span>${(selected.price - selected.supplierPrice).toFixed(2)}</span></div>
                  </div>
                </div>
              )}

              {activePanel === 'analysis' && (
                <div style={{ animation: 'fadeIn 0.2s' }}>
                  {selected.emotionalTrigger && (
                    <div style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid #7c3aed33', padding: 20, borderRadius: 12, marginBottom: 24 }}>
                      <p style={{ fontSize: 11, color: '#7c3aed', fontWeight: 800, marginBottom: 4 }}>EMOTIONAL TRIGGER</p>
                      <p style={{ margin: 0, fontWeight: 600 }}>"{selected.emotionalTrigger}"</p>
                    </div>
                  )}
                  {selected.painNarrative && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ borderLeft: '3px solid #ef4444', paddingLeft: 16 }}>
                        <p style={{ fontSize: 11, color: '#ef4444', fontWeight: 800 }}>WHY THEY'RE HERE</p>
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>{selected.painNarrative.whyYoureHere}</p>
                      </div>
                      <div style={{ borderLeft: '3px solid #22c55e', paddingLeft: 16 }}>
                        <p style={{ fontSize: 11, color: '#22c55e', fontWeight: 800 }}>WHY THIS WORKS</p>
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>{selected.painNarrative.whyThisWorks}</p>
                      </div>
                    </div>
                  )}
                  {selected.suppliers && (
                    <div style={{ marginTop: 32 }}>
                      <p style={{ fontSize: 11, color: '#4a4a6a', fontWeight: 800, marginBottom: 12 }}>TOP SUPPLIERS</p>
                      {selected.suppliers.map(s => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: '#141420', border: '1px solid #1e1e2e', borderRadius: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 13 }}>{s.name} {s.isCheapest && '✅'}</span>
                          <span style={{ fontWeight: 700 }}>${s.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activePanel === 'orders' && (
                <div style={{ animation: 'fadeIn 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Active Fulfillment Queue</h2>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Orders pulled from Stripe Webhooks</div>
                  </div>
                  
                  <div style={{ display: 'grid', gap: 12 }}>
                    {orders.map(order => (
                      <div key={order.id} style={{ background: '#141420', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>{order.id} — {order.customer}</p>
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>{order.items.join(', ')}</p>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 20 }}>
                          <div>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: order.status === 'shipped' ? '#22c55e' : '#f59e0b' }}>
                                {order.status.toUpperCase()}
                            </p>
                            {order.trackingNumber && <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{order.trackingNumber}</p>}
                          </div>
                          <button style={{ background: '#1e1e2e', border: '1px solid #333', color: '#ccc', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>View in AutoDS ↗</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePanel === 'refunds' && (
                <div style={{ animation: 'fadeIn 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div theme-type="alert">
                      <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#ef4444' }}>Refund Approval Queue</h2>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Strict Regulation: No refunds are processed without your manual click.</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gap: 16 }}>
                    {orders.filter(o => o.status === 'flagged_for_refund').map(order => (
                      <div key={order.id} style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>{order.id} — {order.customer}</p>
                            <p style={{ margin: '8px 0', fontSize: 13, color: '#ef4444', fontWeight: 600 }}>{order.refundReason}</p>
                            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Items: {order.items.join(', ')} | Total: ${order.total}</p>
                          </div>
                          <button 
                            onClick={() => {
                                showToast(`🛡️ Processing Refund for ${order.id}...`, "success")
                                setOrders(prev => prev.map(o => o.id === order.id ? {...o, status: 'cancelled'} : o))
                            }}
                            style={{ background: '#ef4444', border: 'none', color: '#fff', borderRadius: 6, padding: '10px 20px', fontSize: 12, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
                          >
                            🛡️ CONFIRM REFUND
                          </button>
                        </div>
                        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(239,68,68,0.1)', fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>
                            Full Audit Account: Customer paid ${order.total}. System detected 0 stock at supplier during fulfillment attempt. Fulfillment was halted. Email notification sent to brannenguidry28@gmail.com. Awaiting human confirmation.
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Queue */}
        <div style={{ borderLeft: '1px solid #1e1e2e', background: '#0f0f15', padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#4a4a6a', marginBottom: 16 }}>PUBLISH QUEUE ({queued.length})</p>
          {queued.map(p => <div key={p.id} style={{ padding: 8, fontSize: 12, borderBottom: '1px solid #1e1e2e' }}>{p.title}</div>)}
          {queued.length > 0 && (
            <button 
                onClick={handlePublishBatch}
                disabled={loading}
                style={{ width: '100%', marginTop: 20, padding: 12, background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
                {loading ? 'Syncing...' : '🚀 Publish Batch to Stripe'}
            </button>
          )}
        </div>
      </div>

      <AdminChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} selectedProduct={selected} />
    </div>
  )
}
