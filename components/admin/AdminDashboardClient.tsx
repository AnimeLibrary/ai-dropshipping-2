'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminChat from '@/components/admin/AdminChat'

// ── Types ────────────────────────────────────────────────────
interface ProductVariant {
  id: string; vid: string; label: string; color: string | null; size: string | null
  retailPrice: number; cjStock: number; image: string | null; isDefault: boolean
  stripeVariantPriceId: string | null
}
interface Product {
  id: string; title: string; slug: string; niche: string; trendScore: number
  price: number; supplierPrice: number; compareAtPrice?: number; validationStatus: string
  stripePriceId?: string | null; stripeProductId?: string | null
  cjProductId?: string | null; cjVariantId?: string | null
  cjSalesRank?: number | null; cjSupplierScore?: number | null; cjLastSyncedAt?: string | null
  heroImage?: string | null; shortDescription?: string | null
  source?: string | null; category?: string | null; createdAt?: string
  variants: ProductVariant[]
}
interface FullProduct extends Product {
  suppliers: { id: string; name: string; url: string; price: number; isReliable: boolean }[]
  reviews: { rating: number }[]
  _count?: { orderItems: number }
}
interface Order {
  id: string; customerName: string; customerEmail: string
  status: string; totalAmount: number; trackingNumber?: string
  createdAt: string
}
interface LogEntry {
  id: string; level: string; source: string; message: string
  meta?: string; createdAt: string
}
interface SystemStatus {
  overallHealth: string; criticalMissing: string[]
  services: { lmStudio: any; stripe: any; database: any }
  envKeys: Record<string, boolean>
}
interface Referral {
  id: string; code: string; ownerEmail: string; ownerName: string | null; creditsEarned: number;
  uses: { id: string; buyerEmail: string; discountAmount: number; creditAwarded: number; status: string; createdAt: string }[];
  createdAt: string
}
interface ArchivedProduct { id: string; title: string; reason: string }

interface ActionReview {
  id: string; productSlug: string; rating: number; title: string | null; body: string; authorName: string; createdAt: string
}

interface SeoCluster {
  id: string; keyword: string; searchVolume: number; intent: string; targetPageType: string; hasContent: boolean; productCount: number; createdAt: string;
}

interface Props {
  pendingProducts: Product[]; approvedProducts: Product[]
  liveOrders: Order[]; archivedProducts: ArchivedProduct[]
  referrals: Referral[]
  pendingReviews: ActionReview[]
  seoClusters: SeoCluster[]
}

type Panel = 'products' | 'orders' | 'safety' | 'health' | 'logs' | 'flow' | 'referrals' | 'reviews' | 'seo'
type ProductsSubTab = 'pipeline' | 'database'

// ── Sub-components ───────────────────────────────────────────
function StatusDot({ ok }: { ok: boolean }) {
  return <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background: ok ? '#22c55e' : '#ef4444', marginRight:6, flexShrink:0 }} />
}

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{ background: `${color}22`, border: `1px solid ${color}44`, color, borderRadius:4, fontSize:10, padding:'2px 7px', fontWeight:700, letterSpacing:'0.04em' }}>
      {children}
    </span>
  )
}

const PANEL_COLOR: Record<string, string> = {
  products:'#7c3aed', orders:'#22c55e', safety:'#f59e0b', health:'#60a5fa', logs:'#f472b6', flow:'#34d399', referrals:'#e8823a', reviews:'#ec4899', seo:'#14b8a6'
}

// ── Main Dashboard ───────────────────────────────────────────
export default function AdminDashboardClient({ pendingProducts, approvedProducts, liveOrders, archivedProducts, referrals, pendingReviews, seoClusters }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [panel, setPanel] = useState<Panel>('products')
  const [productsTab, setProductsTab] = useState<ProductsSubTab>('pipeline')
  const [pending, setPending]   = useState(pendingProducts)
  const [approved, setApproved] = useState(approvedProducts)
  const [orders]                = useState(liveOrders)
  const [archived]              = useState(archivedProducts)
  const [reviews, setReviews]   = useState(pendingReviews)
  const [isChatOpen, setChat]   = useState(true)
  const [toast, setToast]       = useState<{ msg: string; type: 'ok'|'err' } | null>(null)
  const [status, setStatus]     = useState<SystemStatus | null>(null)
  const [logs, setLogs]         = useState<LogEntry[]>([])
  const [logLevel, setLogLevel] = useState<string>('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [cjMapping, setCjMapping] = useState<Record<string, { vId: string, pId: string }>>({})
  // Full database state
  const [allProducts, setAllProducts] = useState<FullProduct[]>([])
  const [dbLoading, setDbLoading] = useState(false)
  const [dbFilter, setDbFilter] = useState('all')
  const [dbSearch, setDbSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const showToast = (msg: string, type: 'ok'|'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Fetch system status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/system/status')
      setStatus(await res.json())
    } catch { setStatus(null) }
  }, [])

  // Fetch logs
  const fetchLogs = useCallback(async (level = '') => {
    try {
      const q = level ? `?level=${level}&limit=80` : '?limit=80'
      const res = await fetch(`/api/admin/logs${q}`)
      const data = await res.json()
      setLogs(data.logs || [])
    } catch {}
  }, [])

  // Fetch all products for database tab
  const fetchAllProducts = useCallback(async (filter = 'all', search = '') => {
    setDbLoading(true)
    try {
      const params = new URLSearchParams({ status: filter })
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/products?${params}`)
      const data = await res.json()
      setAllProducts(data.products || [])
    } catch { showToast('Failed to load products', 'err') }
    finally { setDbLoading(false) }
  }, [])

  useEffect(() => {
    fetchStatus()
    fetchLogs()
    const iv = setInterval(fetchStatus, 30000)
    return () => clearInterval(iv)
  }, [fetchStatus, fetchLogs])

  useEffect(() => { if (panel === 'logs') fetchLogs(logLevel) }, [panel, logLevel, fetchLogs])
  useEffect(() => { if (panel === 'products' && productsTab === 'database') fetchAllProducts(dbFilter, dbSearch) }, [panel, productsTab, fetchAllProducts])

  // Stripe sync backup
  const handleStripeSync = async (productId: string, title: string) => {
    setLoadingId(`stripe-${productId}`)
    try {
      const res = await fetch(`/api/admin/products/${productId}/stripe-sync`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`💳 Synced to Stripe: ${title}`)
      fetchAllProducts(dbFilter, dbSearch)
    } catch (err: any) { showToast(err.message, 'err') }
    finally { setLoadingId(null) }
  }

  // SEO push backup
  const handleSeoPush = async (productId: string, title: string) => {
    setLoadingId(`seo-${productId}`)
    try {
      const res = await fetch(`/api/admin/products/${productId}/seo-push`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`📈 SEO: ${data.message}`)
    } catch (err: any) { showToast(err.message, 'err') }
    finally { setLoadingId(null) }
  }

  const handleProductAction = async (productId: string, action: 'approve' | 'reject') => {
    setLoadingId(productId)
    try {
      const payload = { 
        action, 
        notes: '',
        ...(cjMapping[productId] && {
          cjVariantId: cjMapping[productId].vId,
          cjProductId: cjMapping[productId].pId
        })
      }
      const res = await fetch(`/api/admin/products/${productId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Request failed')
      if (action === 'approve') {
        const prod = pending.find(p => p.id === productId)!
        setPending(prev => prev.filter(p => p.id !== productId))
        setApproved(prev => [...prev, { ...prod, validationStatus: 'approved' }])
        showToast(`✅ Approved: ${prod.title}`)
      } else {
        setPending(prev => prev.filter(p => p.id !== productId))
        showToast(`🗑️ Rejected`, 'err')
      }
    } catch { showToast('Action failed', 'err') }
    finally { setLoadingId(null) }
  }

  const handleEnrich = async (productId: string, productTitle: string) => {
    setLoadingId(`enrich-${productId}`)
    try {
      const res = await fetch(`/api/admin/products/${productId}/enrich`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Enrichment failed')
      showToast(`✨ Enriched: ${productTitle} — AI copy + image updated`)
    } catch (err: any) {
      showToast(err.message, 'err')
    } finally {
      setLoadingId(null)
    }
  }

  const handleRefund = async (orderId: string, action: 'refund' | 'store_credit') => {
    setLoadingId(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Refund failed')
      
      showToast(data.message)
      // Optimistically update order status locally
      const updatedStatus = action === 'refund' ? 'refunded' : 'credited'
      // To properly update, we normally might force a refetch or update state:
      const orderIndex = orders.findIndex(o => o.id === orderId)
      if (orderIndex > -1) {
        orders[orderIndex].status = updatedStatus
      }
    } catch (err: any) {
      showToast(err.message, 'err')
    } finally {
      setLoadingId(null)
    }
  }

  const handleReviewAction = async (reviewId: string, action: 'approve' | 'reject') => {
    setLoadingId(reviewId)
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update review')
      
      setReviews(prev => prev.filter(r => r.id !== reviewId))
      showToast(data.message, action === 'approve' ? 'ok' : 'err')
    } catch (err: any) {
      showToast(err.message, 'err')
    } finally {
      setLoadingId(null)
    }
  }

  // ── Sidebar ─────────────────────────────────────────────────
  const navItems: { id: Panel; label: string; badge?: number }[] = [
    { id: 'products', label: '📦 Products',    badge: pending.length },
    { id: 'orders',   label: '🛒 Orders',      badge: orders.filter(o=>o.status==='processing').length },
    { id: 'safety',   label: '🛡️ Safety Valve', badge: archived.length },
    { id: 'referrals', label: '🎁 Referrals',   badge: referrals.filter(r=>r.uses.some(u=>u.status==='pending')).length || undefined },
    { id: 'reviews',  label: '💬 UGC Reviews',  badge: reviews.length || undefined },
    { id: 'seo',      label: '📈 SEO Fleet',    badge: seoClusters.filter(c => !c.hasContent).length || undefined },
    { id: 'health',   label: '💚 System Health' },
    { id: 'logs',     label: '📋 Logs',         badge: logs.filter(l=>l.level==='error').length || undefined },
    { id: 'flow',     label: '🔀 Data Flow' },
  ]

  // ── Shared styles ────────────────────────────────────────────
  const card = { background:'#111118', border:'1px solid #1e1e2e', borderRadius:12, padding:20, marginBottom:16 }
  const label = { fontSize:10, fontWeight:800 as const, color:'#4a4a6a', letterSpacing:'0.08em', textTransform:'uppercase' as const, marginBottom:8 }

  return (
    <div style={{ display:'flex', height:'100vh', background:'#0c0c0f', color:'#e2e8f0', fontFamily:'Inter,sans-serif', fontSize:13 }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:18, left:'50%', transform:'translateX(-50%)', zIndex:9999, background:'#1a1a2e', border:`1px solid ${toast.type==='ok'?'#22c55e':'#ef4444'}`, borderRadius:8, padding:'10px 22px', fontWeight:700, color:'#fff', fontSize:13, boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
          {toast.msg}
        </div>
      )}

      {/* ── Sidebar ── */}
      <div style={{ width:220, background:'#0f0f17', borderRight:'1px solid #1e1e2e', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'20px 16px 12px', borderBottom:'1px solid #1e1e2e' }}>
          <div style={{ fontWeight:900, fontSize:15, color:'#a78bfa' }}>⚡ Vexsen</div>
          <div style={{ fontSize:10, color:'#4a4a6a', marginTop:2 }}>COMMAND CENTER</div>
        </div>

        <div style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:4 }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setPanel(n.id)} style={{
              width:'100%', textAlign:'left', padding:'9px 12px', borderRadius:8,
              background: panel===n.id ? `${PANEL_COLOR[n.id]}18` : 'transparent',
              border: panel===n.id ? `1px solid ${PANEL_COLOR[n.id]}44` : '1px solid transparent',
              color: panel===n.id ? PANEL_COLOR[n.id] : '#6b7280',
              cursor:'pointer', fontWeight: panel===n.id ? 700 : 500,
              display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12
            }}>
              <span>{n.label}</span>
              {n.badge ? <span style={{ background:'#ef444422', border:'1px solid #ef444444', color:'#f87171', borderRadius:999, fontSize:10, padding:'0 6px', fontWeight:800 }}>{n.badge}</span> : null}
            </button>
          ))}
        </div>

        <div style={{ padding:'12px 16px', borderTop:'1px solid #1e1e2e' }}>
          <button onClick={()=>setChat(!isChatOpen)} style={{ width:'100%', background:'rgba(124,58,237,0.1)', border:'1px solid #7c3aed44', borderRadius:8, color:'#c4b5fd', cursor:'pointer', padding:'8px 0', fontWeight:700, fontSize:12 }}>
            {isChatOpen ? '✕ Close AI Agent' : '💬 Open AI Agent'}
          </button>
        </div>
      </div>

      {/* ── Main Panel ── */}
      <div style={{ flex:1, overflow:'auto', padding:28, marginRight: isChatOpen ? 480 : 0, transition:'margin-right 0.3s ease' }}>

        {/* ── PRODUCTS PANEL ── */}
        {panel === 'products' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h1 style={{ fontSize:20, fontWeight:800, margin:0 }}>📦 Products</h1>
              <div style={{ display:'flex', gap:8 }}>
                {(['pipeline', 'database'] as const).map(t => (
                  <button key={t} onClick={() => setProductsTab(t)} style={{ background: productsTab===t ? '#7c3aed33' : '#1e1e2e', border:`1px solid ${productsTab===t?'#7c3aed55':'#2e2e4e'}`, color: productsTab===t?'#c4b5fd':'#6b7280', borderRadius:6, padding:'6px 16px', cursor:'pointer', fontSize:12, fontWeight:productsTab===t?700:500 }}>
                    {t === 'pipeline' ? '⏳ Pipeline' : '🗄️ All Products'}
                  </button>
                ))}
              </div>
            </div>

            {/* ── PIPELINE SUB-TAB ── */}
            {productsTab === 'pipeline' && (
              <div>
                <div style={{ marginBottom:28 }}>
                  <p style={label}>⏳ Pending Review ({pending.length})</p>
                {pending.length === 0 && <div style={{ ...card, color:'#4a4a6a', textAlign:'center', padding:32 }}>Queue is empty. Paste Kalodata/Minea CSV into the AI Agent or type "scout products" to auto-find best sellers.</div>}
                  {pending.map(p => {
                    const profit = p.price - p.supplierPrice
                    const margin = ((profit / p.price) * 100).toFixed(1)
                    const passes = profit >= 20 && p.price >= p.supplierPrice * 3

                    // CJ Analytics
                    const salesRank = p.cjSalesRank || 0
                    const maxSales = 10000
                    const barPct = Math.min(100, Math.round((salesRank / maxSales) * 100))
                    const supplierScore = p.cjSupplierScore || 0
                    const hasCJ = !!p.cjProductId

                    // Variants
                    const variants = p.variants || []
                    const colors = [...new Set(variants.map(v => v.color).filter(Boolean))] as string[]
                    const sizes  = [...new Set(variants.map(v => v.size).filter(Boolean))]  as string[]
                    const hasVariants = variants.length > 1
                    const totalStock = variants.reduce((s, v) => s + v.cjStock, 0)

                    const CSS_COLOR: Record<string,string> = {
                      black:'#1a1a1a',white:'#f5f5f5',red:'#e53e3e',blue:'#3182ce',
                      green:'#38a169',yellow:'#d69e2e',pink:'#d53f8c',purple:'#805ad5',
                      orange:'#dd6b20',gray:'#718096',grey:'#718096',brown:'#92400e',navy:'#1a365d',
                    }

                    return (
                      <div key={p.id} style={card}>

                        {/* ── Row header ── */}
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                              <span style={{ fontWeight:700, fontSize:14 }}>{p.title}</span>
                              <Tag color={passes?'#22c55e':'#ef4444'}>{passes?'PASSES':'FAILS RULES'}</Tag>
                              <Tag color='#7c3aed'>{p.niche}</Tag>
                              {hasCJ && <Tag color='#60a5fa'>CJ ✓</Tag>}
                            </div>
                          </div>
                          {/* Approve / Reject */}
                          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                            <button onClick={()=>handleProductAction(p.id,'approve')} disabled={loadingId===p.id} style={{ background:'#22c55e22', border:'1px solid #22c55e44', color:'#4ade80', borderRadius:6, padding:'6px 16px', cursor:'pointer', fontWeight:700, fontSize:12, opacity:loadingId===p.id?0.5:1 }}>
                              {loadingId===p.id?'…':'✅ Approve'}
                            </button>
                            <button onClick={()=>handleProductAction(p.id,'reject')} disabled={loadingId===p.id} style={{ background:'#ef444422', border:'1px solid #ef444444', color:'#f87171', borderRadius:6, padding:'6px 14px', cursor:'pointer', fontWeight:700, fontSize:12 }}>
                              ✕ Reject
                            </button>
                          </div>
                        </div>

                        {/* ── 1. CJ ANALYTICS BLOCK (priority: sales → supplier → margin) ── */}
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                          {/* Sales rank */}
                          <div style={{ background:'#0a0a0f', borderRadius:8, padding:'10px 12px', border:'1px solid #1e1e2e' }}>
                            <div style={{ fontSize:10, color:'#4a4a6a', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>① Sales Volume</div>
                            <div style={{ fontWeight:800, fontSize:15, color:'#a78bfa' }}>{salesRank.toLocaleString()}</div>
                            <div style={{ marginTop:4, height:4, background:'#1e1e2e', borderRadius:2, overflow:'hidden' }}>
                              <div style={{ width:`${barPct}%`, height:'100%', background:'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius:2, transition:'width 0.3s ease' }} />
                            </div>
                          </div>
                          {/* Supplier score */}
                          <div style={{ background:'#0a0a0f', borderRadius:8, padding:'10px 12px', border:'1px solid #1e1e2e' }}>
                            <div style={{ fontSize:10, color:'#4a4a6a', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>② Supplier Score</div>
                            <div style={{ fontWeight:800, fontSize:15, color: supplierScore > 70 ? '#4ade80' : supplierScore > 40 ? '#f59e0b' : '#f87171' }}>
                              {hasCJ ? (supplierScore > 0 ? `${supplierScore.toFixed(0)}%` : 'N/A') : '—'}
                            </div>
                            {hasCJ && <div style={{ fontSize:10, color:'#4a4a6a', marginTop:2 }}>{p.cjProductId}</div>}
                          </div>
                          {/* Margin (3rd priority) */}
                          <div style={{ background:'#0a0a0f', borderRadius:8, padding:'10px 12px', border:'1px solid #1e1e2e' }}>
                            <div style={{ fontSize:10, color:'#4a4a6a', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>③ Margin</div>
                            <div style={{ fontWeight:800, fontSize:15, color: profit>=20?'#4ade80':'#f87171' }}>${profit.toFixed(2)} ({margin}%)</div>
                            <div style={{ fontSize:10, color:'#6b7280', marginTop:2 }}>Cost ${p.supplierPrice.toFixed(2)} → Retail ${p.price.toFixed(2)}</div>
                          </div>
                        </div>

                        {/* ── 2. VARIANT GRID ── */}
                        {hasVariants && (
                          <div style={{ marginBottom:12 }}>
                            <div style={{ fontSize:10, color:'#4a4a6a', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
                              Variants ({variants.length}) — Total Stock: {totalStock.toLocaleString()}
                            </div>
                            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                              {/* Color swatches */}
                              {colors.length > 0 && colors.map(c => (
                                <span key={c} title={c} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, color:'#a8a29e', background:'#111118', border:'1px solid #2e2e4e', borderRadius:4, padding:'2px 7px' }}>
                                  <span style={{ width:10, height:10, borderRadius:'50%', background: CSS_COLOR[c.toLowerCase()] || '#888', display:'inline-block', flexShrink:0 }} />
                                  {c}
                                </span>
                              ))}
                              {/* Size pills */}
                              {sizes.length > 0 && sizes.map(s => (
                                <span key={s} style={{ fontSize:10, color:'#a8a29e', background:'#111118', border:'1px solid #2e2e4e', borderRadius:4, padding:'2px 7px' }}>{s}</span>
                              ))}
                            </div>
                            {/* VID table (scrollable for many variants) */}
                            <div style={{ background:'#070710', borderRadius:6, border:'1px solid #1e1e2e', maxHeight:110, overflowY:'auto' }}>
                              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10 }}>
                                <thead><tr style={{ borderBottom:'1px solid #1e1e2e' }}>
                                  <th style={{ padding:'5px 8px', color:'#4a4a6a', textAlign:'left', fontWeight:700 }}>LABEL</th>
                                  <th style={{ padding:'5px 8px', color:'#4a4a6a', textAlign:'left', fontWeight:700 }}>VID</th>
                                  <th style={{ padding:'5px 8px', color:'#4a4a6a', textAlign:'right', fontWeight:700 }}>STOCK</th>
                                  <th style={{ padding:'5px 8px', color:'#4a4a6a', textAlign:'right', fontWeight:700 }}>PRICE</th>
                                </tr></thead>
                                <tbody>
                                  {variants.slice(0,10).map((v,i) => (
                                    <tr key={v.id} style={{ borderBottom: i < variants.length-1 ? '1px solid #111' : 'none' }}>
                                      <td style={{ padding:'4px 8px', color: v.isDefault ? '#c4b5fd' : '#6b7280', fontWeight: v.isDefault ? 700 : 400 }}>{v.label}{v.isDefault?' ★':''}</td>
                                      <td style={{ padding:'4px 8px' }}><code style={{ color:'#38bdf8', fontSize:9 }}>{v.vid}</code></td>
                                      <td style={{ padding:'4px 8px', textAlign:'right', color: v.cjStock===0?'#f87171':v.cjStock<10?'#f59e0b':'#4ade80' }}>{v.cjStock}</td>
                                      <td style={{ padding:'4px 8px', textAlign:'right', color:'#a78bfa' }}>${v.retailPrice.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                  {variants.length > 10 && <tr><td colSpan={4} style={{ padding:'4px 8px', color:'#4a4a6a', textAlign:'center' }}>+{variants.length-10} more variants</td></tr>}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* ── 3. ENRICH button ── */}
                        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                          <button onClick={()=>handleEnrich(p.id, p.title)} disabled={loadingId===`enrich-${p.id}`} style={{ background:'#a78bfa22', border:'1px solid #a78bfa44', color:'#c4b5fd', borderRadius:6, padding:'5px 12px', cursor:'pointer', fontWeight:700, fontSize:11 }}>
                            {loadingId===`enrich-${p.id}` ? '⏳…' : '✨ Enrich Copy'}
                          </button>
                        </div>

                      </div>
                    )
                  })}
                </div>

                <div>
                  <p style={label}>✅ Approved ({approved.length})</p>
                  {approved.map(p => (
                    <div key={p.id} style={{ ...card, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <span style={{ fontWeight:600 }}>{p.title}</span>
                        <span style={{ color:'#6b7280', marginLeft:12, fontSize:12 }}>${p.price.toFixed(2)}</span>
                        {p.stripePriceId ? <Tag color='#22c55e'>💳 IN STRIPE</Tag> : <Tag color='#ef4444'>⚠️ NOT IN STRIPE</Tag>}
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        {!p.stripePriceId && (
                          <button onClick={()=>handleStripeSync(p.id, p.title)} disabled={loadingId===`stripe-${p.id}`} style={{ background:'#f59e0b22', border:'1px solid #f59e0b44', color:'#fbbf24', borderRadius:6, padding:'4px 12px', cursor:'pointer', fontWeight:700, fontSize:11 }}>
                            {loadingId===`stripe-${p.id}` ? '⏳…' : '💳 Push to Stripe'}
                          </button>
                        )}
                        <button onClick={()=>handleEnrich(p.id, p.title)} disabled={loadingId===`enrich-${p.id}`} style={{ background:'#a78bfa22', border:'1px solid #a78bfa44', color:'#c4b5fd', borderRadius:6, padding:'4px 12px', cursor:'pointer', fontWeight:700, fontSize:11 }}>{loadingId===`enrich-${p.id}` ? '⏳…' : '✨ Enrich'}</button>
                        <Tag color='#22c55e'>APPROVED</Tag>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── DATABASE SUB-TAB ── */}
            {productsTab === 'database' && (
              <div>
                {/* Toolbar */}
                <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
                  <input
                    value={dbSearch}
                    onChange={e => setDbSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchAllProducts(dbFilter, dbSearch)}
                    placeholder="Search title, niche, slug…"
                    style={{ background:'#0a0a0a', border:'1px solid #1f1f1f', color:'#e2e8f0', borderRadius:6, padding:'7px 12px', fontSize:12, width:220 }}
                  />
                  {(['all','pending','approved','archived'] as const).map(f => (
                    <button key={f} onClick={() => { setDbFilter(f); fetchAllProducts(f, dbSearch) }} style={{ background: dbFilter===f?'#7c3aed33':'#1e1e2e', border:`1px solid ${dbFilter===f?'#7c3aed55':'#2e2e4e'}`, color: dbFilter===f?'#c4b5fd':'#6b7280', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontSize:11, fontWeight:dbFilter===f?700:500, textTransform:'capitalize' }}>{f}</button>
                  ))}
                  <button onClick={() => fetchAllProducts(dbFilter, dbSearch)} style={{ background:'#1e1e2e', border:'1px solid #2e2e4e', borderRadius:6, color:'#a78bfa', cursor:'pointer', padding:'6px 12px', fontSize:12, fontWeight:700 }}>↻ Refresh</button>
                  <span style={{ marginLeft:'auto', fontSize:11, color:'#4a4a6a' }}>{dbLoading ? 'Loading…' : `${allProducts.length} products`}</span>
                </div>

                {/* Product rows */}
                {allProducts.length === 0 && !dbLoading && (
                  <div style={{ ...card, color:'#4a4a6a', textAlign:'center', padding:40 }}>No products found.</div>
                )}
                {allProducts.map(p => {
                  const isExpanded = expandedId === p.id
                  const profit = p.price - p.supplierPrice
                  const margin = ((profit / p.price) * 100).toFixed(1)
                  const avgRating = p.reviews?.length ? (p.reviews.reduce((s,r)=>s+r.rating,0)/p.reviews.length).toFixed(1) : null
                  let galleryImages: string[] = []
                  try { galleryImages = p.heroImage?.startsWith('[') ? JSON.parse(p.heroImage) : p.heroImage ? [p.heroImage] : [] } catch {}

                  return (
                    <div key={p.id} style={{ ...card, borderColor: p.validationStatus==='approved'?'#22c55e22':p.validationStatus==='archived'?'#ef444422':'#1e1e2e', marginBottom:10 }}>
                      {/* Row header */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }} onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0 }}>
                          {galleryImages[0] && <img src={galleryImages[0]} alt="" style={{ width:40, height:40, objectFit:'cover', borderRadius:6, border:'1px solid #1e1e2e', flexShrink:0 }} />}
                          <div style={{ minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                              <span style={{ fontWeight:700, fontSize:13 }}>{p.title}</span>
                              <Tag color={p.validationStatus==='approved'?'#22c55e':p.validationStatus==='archived'?'#ef4444':'#f59e0b'}>{p.validationStatus.toUpperCase()}</Tag>
                              <Tag color='#7c3aed'>{p.niche}</Tag>
                              {p.stripePriceId ? <Tag color='#22c55e'>💳 STRIPE ✓</Tag> : <Tag color='#ef4444'>⚠️ NO STRIPE</Tag>}
                              {p.cjProductId && <Tag color='#60a5fa'>CJ ✓</Tag>}
                            </div>
                            <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>/{p.slug} · ${p.price.toFixed(2)} retail · ${p.supplierPrice.toFixed(2)} cost · {margin}% margin</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0, marginLeft:12 }}>
                          {/* Backup action buttons — always visible */}
                          {!p.stripePriceId && p.validationStatus === 'approved' && (
                            <button onClick={e=>{e.stopPropagation();handleStripeSync(p.id,p.title)}} disabled={loadingId===`stripe-${p.id}`} title="Push to Stripe" style={{ background:'#f59e0b22', border:'1px solid #f59e0b44', color:'#fbbf24', borderRadius:5, padding:'4px 10px', cursor:'pointer', fontWeight:700, fontSize:11, whiteSpace:'nowrap' }}>
                              {loadingId===`stripe-${p.id}` ? '⏳' : '💳 Stripe'}
                            </button>
                          )}
                          <button onClick={e=>{e.stopPropagation();handleSeoPush(p.id,p.title)}} disabled={loadingId===`seo-${p.id}`} title="Push SEO cluster" style={{ background:'#14b8a622', border:'1px solid #14b8a644', color:'#5eead4', borderRadius:5, padding:'4px 10px', cursor:'pointer', fontWeight:700, fontSize:11 }}>
                            {loadingId===`seo-${p.id}` ? '⏳' : '📈 SEO'}
                          </button>
                          <button onClick={e=>{e.stopPropagation();handleEnrich(p.id,p.title)}} disabled={loadingId===`enrich-${p.id}`} title="Re-enrich AI copy" style={{ background:'#a78bfa22', border:'1px solid #a78bfa44', color:'#c4b5fd', borderRadius:5, padding:'4px 10px', cursor:'pointer', fontWeight:700, fontSize:11 }}>
                            {loadingId===`enrich-${p.id}` ? '⏳' : '✨ Enrich'}
                          </button>
                          <span style={{ color:'#4a4a6a', fontSize:14 }}>{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {/* Expanded detail view */}
                      {isExpanded && (
                        <div style={{ marginTop:16, borderTop:'1px solid #1e1e2e', paddingTop:16 }}>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12, marginBottom:16 }}>
                            <div style={{ background:'#0a0a0a', borderRadius:8, padding:12 }}>
                              <div style={{ fontSize:10, color:'#4a4a6a', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Pricing</div>
                              <div style={{ fontSize:12, display:'flex', flexDirection:'column', gap:4 }}>
                                <span>Retail: <strong style={{color:'#a78bfa'}}>${p.price.toFixed(2)}</strong></span>
                                <span>Cost: <strong style={{color:'#e2e8f0'}}>${p.supplierPrice.toFixed(2)}</strong></span>
                                <span>Profit: <strong style={{color:profit>=20?'#4ade80':'#f87171'}}>${profit.toFixed(2)} ({margin}%)</strong></span>
                                {p.compareAtPrice && <span>Compare at: <strong style={{color:'#6b7280'}}>${p.compareAtPrice.toFixed(2)}</strong></span>}
                              </div>
                            </div>
                            <div style={{ background:'#0a0a0a', borderRadius:8, padding:12 }}>
                              <div style={{ fontSize:10, color:'#4a4a6a', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Stripe</div>
                              <div style={{ fontSize:11, color:'#6b7280', wordBreak:'break-all', display:'flex', flexDirection:'column', gap:4 }}>
                                <span>Product ID: <code style={{color: p.stripeProductId?'#4ade80':'#4a4a6a'}}>{p.stripeProductId || 'not synced'}</code></span>
                                <span>Price ID: <code style={{color: p.stripePriceId?'#4ade80':'#4a4a6a'}}>{p.stripePriceId || 'not synced'}</code></span>
                                {p.stripeProductId && <a href={`https://dashboard.stripe.com/products/${p.stripeProductId}`} target="_blank" style={{color:'#7c3aed', fontSize:11}}>Open in Stripe →</a>}
                              </div>
                            </div>
                            <div style={{ background:'#0a0a0a', borderRadius:8, padding:12 }}>
                              <div style={{ fontSize:10, color:'#4a4a6a', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>CJ Dropshipping</div>
                              <div style={{ fontSize:11, color:'#6b7280', display:'flex', flexDirection:'column', gap:4 }}>
                                <span>Product ID: <code style={{color: p.cjProductId?'#4ade80':'#4a4a6a'}}>{p.cjProductId || 'not set'}</code></span>
                                <span>Variant ID: <code style={{color: p.cjVariantId?'#4ade80':'#4a4a6a'}}>{p.cjVariantId || 'not set'}</code></span>
                                <span>Source: <code style={{color:'#a78bfa'}}>{p.source || 'manual'}</code></span>
                              </div>
                            </div>
                            <div style={{ background:'#0a0a0a', borderRadius:8, padding:12 }}>
                              <div style={{ fontSize:10, color:'#4a4a6a', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Performance</div>
                              <div style={{ fontSize:11, color:'#6b7280', display:'flex', flexDirection:'column', gap:4 }}>
                                <span>Orders: <strong style={{color:'#e2e8f0'}}>{p._count?.orderItems || 0}</strong></span>
                                <span>Reviews: <strong style={{color:'#e2e8f0'}}>{p.reviews?.length || 0}</strong> {avgRating && <span style={{color:'#f59e0b'}}>★ {avgRating}</span>}</span>
                                <span>Trend Score: <strong style={{color:'#60a5fa'}}>{p.trendScore}/100</strong></span>
                                <span>Created: <strong style={{color:'#e2e8f0'}}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'n/a'}</strong></span>
                              </div>
                            </div>
                          </div>

                          {/* Gallery images */}
                          {galleryImages.length > 0 && (
                            <div style={{ marginBottom:12 }}>
                              <div style={{ fontSize:10, color:'#4a4a6a', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Images ({galleryImages.length})</div>
                              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                                {galleryImages.map((img, i) => (
                                  <a key={i} href={img} target="_blank">
                                    <img src={img} alt={`img-${i}`} style={{ width:64, height:64, objectFit:'cover', borderRadius:6, border:'1px solid #1e1e2e' }} />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Short description */}
                          {p.shortDescription && (
                            <div style={{ fontSize:12, color:'#a8a29e', background:'#0a0a0a', borderRadius:8, padding:12 }}>
                              <div style={{ fontSize:10, color:'#4a4a6a', fontWeight:700, textTransform:'uppercase', marginBottom:6 }}>Description</div>
                              {p.shortDescription}
                            </div>
                          )}

                          {/* View on store link */}
                          <div style={{ marginTop:12, display:'flex', gap:8 }}>
                            <a href={`/products/${p.slug}`} target="_blank" style={{ background:'#1e1e2e', border:'1px solid #2e2e4e', color:'#60a5fa', borderRadius:6, padding:'5px 12px', fontSize:11, fontWeight:700, textDecoration:'none' }}>🔗 View on Store</a>
                            {!p.stripePriceId && p.validationStatus === 'approved' && (
                              <button onClick={()=>handleStripeSync(p.id,p.title)} disabled={loadingId===`stripe-${p.id}`} style={{ background:'#f59e0b22', border:'1px solid #f59e0b44', color:'#fbbf24', borderRadius:6, padding:'5px 12px', cursor:'pointer', fontWeight:700, fontSize:11 }}>
                                {loadingId===`stripe-${p.id}` ? '⏳ Syncing…' : '💳 Force Push to Stripe'}
                              </button>
                            )}
                            <button onClick={()=>handleSeoPush(p.id,p.title)} disabled={loadingId===`seo-${p.id}`} style={{ background:'#14b8a622', border:'1px solid #14b8a644', color:'#5eead4', borderRadius:6, padding:'5px 12px', cursor:'pointer', fontWeight:700, fontSize:11 }}>
                              {loadingId===`seo-${p.id}` ? '⏳ Pushing…' : '📈 Force SEO Push'}
                            </button>
                            <button onClick={()=>handleEnrich(p.id,p.title)} disabled={loadingId===`enrich-${p.id}`} style={{ background:'#a78bfa22', border:'1px solid #a78bfa44', color:'#c4b5fd', borderRadius:6, padding:'5px 12px', cursor:'pointer', fontWeight:700, fontSize:11 }}>
                              {loadingId===`enrich-${p.id}` ? '⏳ Enriching…' : '✨ Re-Enrich'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS PANEL ── */}
        {panel === 'orders' && (
          <div>
            <h1 style={{ fontSize:20, fontWeight:800, margin:'0 0 20px' }}>Live Orders</h1>
            <div style={{ ...card, color:'#60a5fa', fontSize:12, marginBottom:20 }}>
              ℹ️ Orders are written to DB when Stripe webhook fires. AutoDS push is queued on creation — activate with <code>AUTODS_API_KEY</code>.
            </div>
            {orders.length === 0 && <div style={{ ...card, color:'#4a4a6a', textAlign:'center', padding:32 }}>No orders yet. Orders appear here when Stripe checkout completes.</div>}
            {orders.map(o => (
              <div key={o.id} style={card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight:700, marginBottom:4 }}>{o.customerName} <span style={{ color:'#6b7280', fontWeight:400, fontSize:12 }}>&lt;{o.customerEmail}&gt;</span></div>
                    <div style={{ fontSize:12, color:'#6b7280' }}>{new Date(o.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign:'right', display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontWeight:800, color:'#4ade80', fontSize:15 }}>${o.totalAmount.toFixed(2)}</span>
                    <Tag color={ o.status==='shipped'?'#22c55e': o.status==='processing'?'#f59e0b': o.status==='refunded'?'#ef4444':'#60a5fa' }>{o.status.toUpperCase()}</Tag>
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:8 }}>
                  <div>
                    {o.trackingNumber && <div style={{ fontSize:11, color:'#6b7280' }}>Tracking: {o.trackingNumber}</div>}
                  </div>
                  {(o.status === 'processing' || o.status === 'shipped') && (
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=>handleRefund(o.id,'store_credit')} disabled={loadingId===o.id} style={{ background:'#0c0c0f', border:'1px solid #1e1e2e', color:'#60a5fa', borderRadius:4, padding:'4px 10px', fontSize:11, cursor:'pointer' }}>Store Credit</button>
                      <button onClick={()=>handleRefund(o.id,'refund')} disabled={loadingId===o.id} style={{ background:'#ef444422', border:'1px solid #ef444444', color:'#f87171', borderRadius:4, padding:'4px 10px', fontSize:11, cursor:'pointer' }}>Refund</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── SAFETY VALVE PANEL ── */}
        {panel === 'safety' && (
          <div>
            <h1 style={{ fontSize:20, fontWeight:800, margin:'0 0 8px', color:'#f59e0b' }}>🛡️ Safety Valve</h1>
            <p style={{ color:'#6b7280', marginBottom:20, fontSize:12 }}>Products archived by automated margin/stock checks. No manual approval needed — they are suppressed from the store.</p>
            {archived.length === 0 && <div style={{ ...card, color:'#4a4a6a', textAlign:'center', padding:32 }}>✅ No archived products. All guardrails clear.</div>}
            {archived.map(p => (
              <div key={p.id} style={{ ...card, borderColor:'#f59e0b33' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight:700, marginBottom:4 }}>{p.title}</div>
                    <div style={{ fontSize:12, color:'#f59e0b' }}>{p.reason}</div>
                  </div>
                  <Tag color='#f59e0b'>ARCHIVED</Tag>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── REFERRALS PANEL ── */}
        {panel === 'referrals' && (
          <div>
            <h1 style={{ fontSize:20, fontWeight:800, margin:'0 0 20px', color: PANEL_COLOR.referrals }}>🎁 Referral Network</h1>
            <p style={{ color:'#6b7280', marginBottom:20, fontSize:12 }}>Track generated promo codes, usage, and store credits owed to referrers.</p>
            {referrals.length === 0 && <div style={{ ...card, color:'#4a4a6a', textAlign:'center', padding:32 }}>No users have generated referral codes yet.</div>}
            {referrals.map(r => (
              <div key={r.id} style={{ ...card, borderColor: '#e8823a33' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight:900, fontSize:16, color:'#fdf0e6', letterSpacing:'0.05em' }}>{r.code}</div>
                    <div style={{ fontSize:12, color:'#a8a29e', marginTop:4 }}>Owner: {r.ownerName || 'Unknown'} &lt;{r.ownerEmail}&gt;</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:12, color:'#a8a29e', marginBottom: 2 }}>Credits Earned</div>
                    <div style={{ fontSize:18, fontWeight:800, color:'#4ade80' }}>${r.creditsEarned.toFixed(2)}</div>
                  </div>
                </div>
                
                {r.uses.length > 0 ? (
                  <div style={{ background: '#0a0a0a', borderRadius: 8, padding: 12, border: '1px solid #1f1f1f' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#57534e', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Usage History</div>
                    {r.uses.map(u => (
                      <div key={u.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding: '6px 0', borderBottom: '1px solid #111' }}>
                        <div>
                          <div style={{ fontSize:12, color:'#f5f5f4' }}>{u.buyerEmail}</div>
                          <div style={{ fontSize:10, color:'#57534e' }}>{new Date(u.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <span style={{ fontSize:11, color:'#c96d22', marginRight:12 }}>Buyer Saved: ${u.discountAmount.toFixed(2)}</span>
                          <Tag color={u.status === 'confirmed' ? '#22c55e' : '#f59e0b'}>{u.status.toUpperCase()}</Tag>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize:12, color:'#57534e', fontStyle:'italic' }}>No uses yet.</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── REVIEWS MODERATION PANEL ── */}
        {panel === 'reviews' && (
          <div>
            <h1 style={{ fontSize:20, fontWeight:800, margin:'0 0 20px', color: PANEL_COLOR.reviews }}>💬 Review Moderation</h1>
            <p style={{ color:'#6b7280', marginBottom:20, fontSize:12 }}>User-generated content requires admin approval before appearing on the live product pages.</p>
            {reviews.length === 0 && <div style={{ ...card, color:'#4a4a6a', textAlign:'center', padding:32 }}>Zero pending reviews in the queue.</div>}
            
            <div style={{ display: 'grid', gap: 16 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize:14, fontWeight:800, color:'#fdf0e6' }}>{r.authorName}</span>
                        <div style={{ display: 'flex', gap: 2, color: '#f59e0b', fontSize: 13 }}>
                          {Array.from({ length: r.rating }).map((_, i) => <span key={i}>★</span>)}
                          {Array.from({ length: 5 - r.rating }).map((_, i) => <span key={i} style={{ color: '#2e2e4e' }}>★</span>)}
                        </div>
                      </div>
                      <div style={{ fontSize:11, color:'#6b7280' }}>Product Slug: <a href={`/products/${r.productSlug}`} target="_blank" style={{ color: '#60a5fa', textDecoration:'none' }}>{r.productSlug}</a></div>
                    </div>
                    <div style={{ fontSize:11, color:'#6b7280' }}>{new Date(r.createdAt).toLocaleString()}</div>
                  </div>

                  <div style={{ background: '#0a0a0a', padding: 12, borderRadius: 8, border: '1px solid #1f1f1f' }}>
                    {r.title && <h4 style={{ margin: '0 0 4px', fontSize: 13, color: '#e2e8f0' }}>"{r.title}"</h4>}
                    <p style={{ margin: 0, fontSize: 13, color: '#a8a29e', lineHeight: 1.5 }}>"{r.body}"</p>
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={()=>handleReviewAction(r.id, 'reject')} disabled={loadingId===r.id} style={{ background:'#ef444422', border:'1px solid #ef444444', color:'#f87171', borderRadius:6, padding:'6px 14px', cursor:'pointer', fontWeight:700, fontSize:12 }}>
                      🗑️ Reject & Delete
                    </button>
                    <button onClick={()=>handleReviewAction(r.id, 'approve')} disabled={loadingId===r.id} style={{ background:'#22c55e22', border:'1px solid #22c55e44', color:'#4ade80', borderRadius:6, padding:'6px 14px', cursor:'pointer', fontWeight:700, fontSize:12 }}>
                      ✅ Approve to Store
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SEO FLEET STATUS PANEL ── */}
        {panel === 'seo' && (
          <div>
            <h1 style={{ fontSize:20, fontWeight:800, margin:'0 0 20px', color: PANEL_COLOR.seo }}>📈 SEO Fleet Status</h1>
            <p style={{ color:'#6b7280', marginBottom:20, fontSize:12 }}>
              Track all programmatic SEO pages and internal keyword clusters mapped to your drop-shipping products.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 16, marginBottom: 24 }}>
              <div style={{ ...card, marginBottom: 0, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#fdf0e6' }}>{seoClusters.length}</div>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', marginTop: 4, fontWeight: 600 }}>Total Clusters</div>
              </div>
              <div style={{ ...card, marginBottom: 0, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#34d399' }}>{seoClusters.filter(c => c.hasContent).length}</div>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', marginTop: 4, fontWeight: 600 }}>Generated Guides</div>
              </div>
              <div style={{ ...card, marginBottom: 0, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b' }}>{seoClusters.reduce((sum, c) => sum + c.productCount, 0)}</div>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', marginTop: 4, fontWeight: 600 }}>Products Mapped</div>
              </div>
            </div>

            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                <thead style={{ background: '#0a0a0f', borderBottom: '1px solid #1e1e2e' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: 600 }}>KEYWORD CLUSTER</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: 600 }}>INTENT / TYPE</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: 600 }}>VOL</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: 600 }}>PRODUCTS</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: 600, textAlign: 'right' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {seoClusters.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: i === seoClusters.length - 1 ? 'none' : '1px solid #1e1e2e' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fdf0e6' }}>{c.keyword}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <Tag color="#7c3aed">{c.intent}</Tag>
                        <span style={{ color:'#6b7280', marginLeft: 6 }}>{c.targetPageType}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#a78bfa' }}>{c.searchVolume.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', color: '#a8a29e' }}>{c.productCount} mapped</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {c.hasContent ? (
                          <Tag color="#22c55e">✅ Live</Tag>
                        ) : (
                          <Tag color="#f59e0b">⏳ Awaiting AI</Tag>
                        )}
                      </td>
                    </tr>
                  ))}
                  {seoClusters.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: '#4a4a6a' }}>
                        No keyword clusters found. Add products to trigger semantic clustering.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SYSTEM HEALTH PANEL ── */}
        {panel === 'health' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h1 style={{ fontSize:20, fontWeight:800, margin:0 }}>💚 System Health</h1>
              <button onClick={fetchStatus} style={{ background:'#1e1e2e', border:'1px solid #2e2e4e', borderRadius:6, color:'#a78bfa', cursor:'pointer', padding:'6px 14px', fontSize:12, fontWeight:700 }}>Refresh</button>
            </div>

            {!status && <div style={{ ...card, color:'#4a4a6a' }}>Loading status...</div>}
            {status && <>
              <div style={{ ...card, borderColor: status.overallHealth==='operational'?'#22c55e33':'#ef444433' }}>
                <p style={label}>Overall Health</p>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:16, fontWeight:800, color: status.overallHealth==='operational'?'#4ade80':'#f87171' }}>
                  <StatusDot ok={status.overallHealth==='operational'} />
                  {status.overallHealth.toUpperCase()}
                </div>
                {status.criticalMissing.length > 0 && (
                  <div style={{ marginTop:12, background:'#ef444411', border:'1px solid #ef444433', borderRadius:6, padding:'8px 12px', fontSize:12, color:'#f87171' }}>
                    ⚠️ Critical ENV vars missing: {status.criticalMissing.join(', ')}
                  </div>
                )}
              </div>

              <div style={card}>
                <p style={label}>Live Service Pings</p>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    { name:'LM Studio (Local AI)', data: status.services.lmStudio },
                    { name:'Stripe API', data: status.services.stripe },
                    { name:'Postgres Database', data: status.services.database },
                  ].map(s => (
                    <div key={s.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'#0c0c0f', borderRadius:8, border:'1px solid #1e1e2e' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <StatusDot ok={s.data?.status==='online'} />
                        <span style={{ fontWeight:600 }}>{s.name}</span>
                      </div>
                      <div style={{ display:'flex', gap:12, fontSize:12 }}>
                        {s.data?.latencyMs && <span style={{ color:'#6b7280' }}>{s.data.latencyMs}ms</span>}
                        {s.data?.model && <span style={{ color:'#a78bfa' }}>{s.data.model}</span>}
                        <Tag color={s.data?.status==='online'?'#22c55e':'#ef4444'}>{s.data?.status || 'unknown'}</Tag>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={card}>
                <p style={label}>Environment Keys</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {Object.entries(status.envKeys).map(([k, v]) => (
                    <div key={k} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', background:'#0c0c0f', borderRadius:6, border:'1px solid #1e1e2e', fontSize:12 }}>
                      <StatusDot ok={v} />
                      <span style={{ color: v ? '#e2e8f0' : '#6b7280', fontFamily:'monospace', fontSize:11 }}>{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>}
          </div>
        )}

        {/* ── LOGS PANEL ── */}
        {panel === 'logs' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h1 style={{ fontSize:20, fontWeight:800, margin:0 }}>📋 System Logs</h1>
              <div style={{ display:'flex', gap:8 }}>
                {['', 'info', 'warn', 'error'].map(l => (
                  <button key={l} onClick={()=>setLogLevel(l)} style={{ background: logLevel===l ? '#7c3aed33' : '#1e1e2e', border:`1px solid ${logLevel===l?'#7c3aed55':'#2e2e4e'}`, color: logLevel===l ? '#c4b5fd' : '#6b7280', borderRadius:6, padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight: logLevel===l?700:500 }}>
                    {l || 'All'}
                  </button>
                ))}
                <button onClick={()=>fetchLogs(logLevel)} style={{ background:'#1e1e2e', border:'1px solid #2e2e4e', borderRadius:6, color:'#a78bfa', cursor:'pointer', padding:'5px 12px', fontSize:12, fontWeight:700 }}>↻</button>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {logs.length === 0 && <div style={{ ...card, color:'#4a4a6a', textAlign:'center', padding:32 }}>No logs yet.</div>}
              {logs.map(log => (
                <div key={log.id} style={{ background:'#0f0f17', border:`1px solid ${log.level==='error'?'#ef444433':log.level==='warn'?'#f59e0b33':'#1e1e2e'}`, borderRadius:8, padding:'10px 14px', display:'flex', gap:12, alignItems:'flex-start' }}>
                  <Tag color={log.level==='error'?'#ef4444':log.level==='warn'?'#f59e0b':'#60a5fa'}>{log.level}</Tag>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, color:'#4a4a6a', marginBottom:2, fontFamily:'monospace' }}>{log.source} · {new Date(log.createdAt).toLocaleTimeString()}</div>
                    <div style={{ fontSize:12, wordBreak:'break-word' }}>{log.message}</div>
                    {log.meta && <details style={{ marginTop:4 }}><summary style={{ fontSize:11, color:'#6b7280', cursor:'pointer' }}>Meta</summary><pre style={{ fontSize:10, color:'#6b7280', marginTop:4, overflow:'auto' }}>{JSON.stringify(JSON.parse(log.meta), null, 2)}</pre></details>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DATA FLOW PANEL ── */}
        {panel === 'flow' && (
          <div>
            <h1 style={{ fontSize:20, fontWeight:800, margin:'0 0 20px' }}>🔀 Data Flow</h1>
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {[
                { step:'1', label:'Data Ingestion', desc:'Paste Kalodata/Minea CSV into AI Agent → parsed + DB write', count: pending.length + approved.length, color:'#7c3aed', status: (pending.length + approved.length) > 0 },
                { step:'2', label:'AI Analysis', desc:'Agent calls analyze_product → saturation score, margin check, supplier intel', count: approved.length, color:'#60a5fa', status: approved.length > 0 },
                { step:'3', label:'Admin Approval', desc:'You approve/reject via dashboard or AI chat → DB status update', count: approved.length, color:'#22c55e', status: approved.length > 0 },
                { step:'4', label:'Stripe Sync', desc:'Approved products → Stripe Product + Price created → storefront live', count: 0, color:'#f59e0b', status: false },
                { step:'5', label:'Checkout', desc:'Customer pays → Stripe Checkout Session → Webhook fires', count: orders.length, color:'#f59e0b', status: orders.length > 0 },
                { step:'6', label:'AutoDS Fulfillment', desc:'Order DB write → AutoDS API push → supplier ships to customer', count: orders.filter(o=>o.status==='shipped').length, color:'#34d399', status: orders.some(o=>o.status==='shipped') },
              ].map((s, i, arr) => (
                <div key={s.step} style={{ display:'flex', gap:16, alignItems:'stretch' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:32, flexShrink:0 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background: s.status ? `${s.color}33` : '#1e1e2e', border:`2px solid ${s.status ? s.color : '#2e2e4e'}`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12, color: s.status ? s.color : '#4a4a6a', flexShrink:0 }}>{s.step}</div>
                    {i < arr.length-1 && <div style={{ flex:1, width:2, background: s.status ? `${s.color}44` : '#1e1e2e', margin:'4px 0' }} />}
                  </div>
                  <div style={{ ...card, flex:1, marginLeft:0, marginBottom:i < arr.length-1 ? 0 : 16, borderRadius:10, borderColor: s.status ? `${s.color}33` : '#1e1e2e' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ fontWeight:700, color: s.status ? s.color : '#6b7280', marginBottom:4 }}>{s.label}</div>
                        <div style={{ fontSize:12, color:'#6b7280' }}>{s.desc}</div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:18, fontWeight:800, color: s.count > 0 ? s.color : '#2e2e4e' }}>{s.count}</div>
                        <Tag color={s.status?s.color:'#4a4a6a'}>{s.status?'ACTIVE':'WAITING'}</Tag>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── AI Chat ── */}
      <AdminChat isOpen={isChatOpen} onClose={() => setChat(false)} />
    </div>
  )
}
