'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminChat from '@/components/admin/AdminChat'

// ── Types ────────────────────────────────────────────────────
interface Product {
  id: string; title: string; niche: string; trendScore: number
  price: number; supplierPrice: number; validationStatus: string
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
interface ArchivedProduct { id: string; title: string; reason: string }

interface Props {
  pendingProducts: Product[]; approvedProducts: Product[]
  liveOrders: Order[]; archivedProducts: ArchivedProduct[]
}

type Panel = 'products' | 'orders' | 'safety' | 'health' | 'logs' | 'flow'

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
  products:'#7c3aed', orders:'#22c55e', safety:'#f59e0b', health:'#60a5fa', logs:'#f472b6', flow:'#34d399'
}

// ── Main Dashboard ───────────────────────────────────────────
export default function AdminDashboardClient({ pendingProducts, approvedProducts, liveOrders, archivedProducts }: Props) {
  const [panel, setPanel] = useState<Panel>('products')
  const [pending, setPending]   = useState(pendingProducts)
  const [approved, setApproved] = useState(approvedProducts)
  const [orders]                = useState(liveOrders)
  const [archived]              = useState(archivedProducts)
  const [isChatOpen, setChat]   = useState(true)
  const [toast, setToast]       = useState<{ msg: string; type: 'ok'|'err' } | null>(null)
  const [status, setStatus]     = useState<SystemStatus | null>(null)
  const [logs, setLogs]         = useState<LogEntry[]>([])
  const [logLevel, setLogLevel] = useState<string>('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

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

  useEffect(() => {
    fetchStatus()
    fetchLogs()
    const iv = setInterval(fetchStatus, 30000)
    return () => clearInterval(iv)
  }, [fetchStatus, fetchLogs])

  useEffect(() => { if (panel === 'logs') fetchLogs(logLevel) }, [panel, logLevel, fetchLogs])

  const handleProductAction = async (productId: string, action: 'approve' | 'reject') => {
    setLoadingId(productId)
    try {
      const res = await fetch(`/api/admin/products/${productId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: '' })
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

  // ── Sidebar ─────────────────────────────────────────────────
  const navItems: { id: Panel; label: string; badge?: number }[] = [
    { id: 'products', label: '📦 Products',    badge: pending.length },
    { id: 'orders',   label: '🛒 Orders',      badge: orders.filter(o=>o.status==='processing').length },
    { id: 'safety',   label: '🛡️ Safety Valve', badge: archived.length },
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
          <div style={{ fontWeight:900, fontSize:15, color:'#a78bfa' }}>⚡ TrendDrop</div>
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
            <h1 style={{ fontSize:20, fontWeight:800, margin:'0 0 20px' }}>Product Pipeline</h1>

            <div style={{ marginBottom:28 }}>
              <p style={label}>⏳ Pending Review ({pending.length})</p>
              {pending.length === 0 && <div style={{ ...card, color:'#4a4a6a', textAlign:'center', padding:32 }}>Queue is empty. Paste Kalodata/Minea CSV into the AI Agent to import products.</div>}
              {pending.map(p => {
                const profit = p.price - p.supplierPrice
                const margin = ((profit / p.price) * 100).toFixed(1)
                const passes = profit >= 20 && p.price >= p.supplierPrice * 3
                return (
                  <div key={p.id} style={card}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                          <span style={{ fontWeight:700, fontSize:14 }}>{p.title}</span>
                          <Tag color={passes?'#22c55e':'#ef4444'}>{passes?'PASSES RULES':'FAILS RULES'}</Tag>
                          <Tag color='#7c3aed'>{p.niche}</Tag>
                        </div>
                        <div style={{ display:'flex', gap:20, color:'#6b7280', fontSize:12 }}>
                          <span>Cost: <strong style={{color:'#e2e8f0'}}>${p.supplierPrice.toFixed(2)}</strong></span>
                          <span>Retail: <strong style={{color:'#a78bfa'}}>${p.price.toFixed(2)}</strong></span>
                          <span>Profit: <strong style={{color: profit>=20 ?'#4ade80':'#f87171'}}>${profit.toFixed(2)} ({margin}%)</strong></span>
                          <span>Trend: <strong style={{color:'#60a5fa'}}>{p.trendScore}/100</strong></span>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                        <button onClick={()=>handleProductAction(p.id,'approve')} disabled={loadingId===p.id} style={{ background:'#22c55e22', border:'1px solid #22c55e44', color:'#4ade80', borderRadius:6, padding:'6px 14px', cursor:'pointer', fontWeight:700, fontSize:12, opacity:loadingId===p.id?0.5:1 }}>
                          {loadingId===p.id?'…':'✅ Approve'}
                        </button>
                        <button onClick={()=>handleProductAction(p.id,'reject')} disabled={loadingId===p.id} style={{ background:'#ef444422', border:'1px solid #ef444444', color:'#f87171', borderRadius:6, padding:'6px 14px', cursor:'pointer', fontWeight:700, fontSize:12 }}>
                          ✕ Reject
                        </button>
                      </div>
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
                  </div>
                  <Tag color='#22c55e'>APPROVED</Tag>
                </div>
              ))}
            </div>
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
                    <Tag color={ o.status==='shipped'?'#22c55e': o.status==='processing'?'#f59e0b':'#ef4444' }>{o.status.toUpperCase()}</Tag>
                  </div>
                </div>
                {o.trackingNumber && <div style={{ marginTop:8, fontSize:11, color:'#6b7280' }}>Tracking: {o.trackingNumber}</div>}
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
