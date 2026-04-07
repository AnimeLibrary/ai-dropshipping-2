'use client'

import { useState } from 'react'

// ============================================================
// ADMIN COMMAND CENTER
// Route: /admin (protected by middleware — HTTP Basic Auth)
// Not linked from any public page. Access via direct URL only.
//
// Panel layout:
//   Left  — Pending products (AI picks awaiting human review)
//   Center — Deep Product Analysis (pain + emotional trigger)
//   Right  — Approved queue (batching before publish)
// ============================================================

interface AdminProduct {
  id: string
  title: string
  niche: string
  trendScore: number
  source: string
  price: number
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
}

// Simulated data — in production this hits GET /api/admin/products
const MOCK_PENDING: AdminProduct[] = [
  {
    id: 'weighted-calm-blanket',
    title: 'WeightedCalm Blanket',
    niche: 'sleep',
    trendScore: 91,
    source: 'minea',
    price: 79.99,
    validationStatus: 'pending',
    validationNotes: 'Verify supplier MOQ and shipping time before approving',
    emotionalTrigger: 'exhaustion from years of broken, anxious sleep',
    painNarrative: {
      whyYoureHere:
        "It's late. You're exhausted — genuinely, bone-tired exhausted. But the moment you lie down your mind starts running. The same thoughts. The same low hum of worry.",
      realCause:
        "Anxiety keeps your nervous system locked in fight-or-flight mode even when your body is still. Cortisol stays elevated, your heart rate stays slightly up.",
      whyThisWorks:
        "Deep-touch pressure — the same signal as a firm hug — physically activates your parasympathetic nervous system. It's not a supplement or a trick. It's biology.",
    },
    adAngles: [
      {
        hook: "I haven't slept properly in 3 years. Until I tried this.",
        pain: 'Chronic sleep deprivation from anxiety',
        emotion: 'hope',
        platform: 'tiktok',
        performanceScore: 92,
      },
    ],
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
    validationStatus: 'approved',
    emotionalTrigger: 'fear of permanent back damage from years of poor posture',
    adAngles: [],
  },
  {
    id: 'furroll-pet-hair-remover',
    title: 'FurRoll Pet Hair Remover',
    niche: 'pet-care',
    trendScore: 76,
    source: 'kalodata',
    price: 24.99,
    validationStatus: 'approved',
    emotionalTrigger: 'embarrassment from pet hair in front of guests',
    adAngles: [],
  },
]

type Panel = 'pending' | 'analysis' | 'queue'

export default function AdminPage() {
  const [pending, setPending] = useState<AdminProduct[]>(MOCK_PENDING)
  const [approved, setApproved] = useState<AdminProduct[]>(MOCK_APPROVED)
  const [queued, setQueued] = useState<AdminProduct[]>([])
  const [selected, setSelected] = useState<AdminProduct | null>(MOCK_PENDING[0] || null)
  const [activePanel, setActivePanel] = useState<Panel>('pending')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

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
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      return true
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unexpected error'
      showToast(msg, 'error')
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
    setApproved((prev) => prev.filter((p) => p.id !== product.id))
    setQueued((prev) => [...prev, { ...product, validationStatus: 'queuedForPublish' }])
    showToast(`📤 Queued for publish: ${product.title}`)
  }

  const handlePublishAll = () => {
    if (queued.length === 0) return
    showToast(`🚀 Publishing ${queued.length} product(s)...`)
    setQueued([])
    // In production: POST /api/admin/publish-batch with queued IDs
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
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'success' ? '#22c55e' : '#ef4444'}`,
            borderRadius: 8,
            padding: '12px 20px',
            color: toast.type === 'success' ? '#4ade80' : '#f87171',
            fontWeight: 600,
            fontSize: 14,
            backdropFilter: 'blur(8px)',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid #1e1e2e',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#a78bfa', letterSpacing: '-0.01em' }}>
            ⚡ TrendDrop Command Center
          </span>
          <span style={{ marginLeft: 12, fontSize: 11, color: '#4a4a6a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Admin Only · Not Indexed
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#6b7280' }}>
          <span>⏳ Pending: <strong style={{ color: '#f59e0b' }}>{pending.length}</strong></span>
          <span>✓ Approved: <strong style={{ color: '#22c55e' }}>{approved.length}</strong></span>
          <span>📤 Queued: <strong style={{ color: '#a78bfa' }}>{queued.length}</strong></span>
        </div>
      </div>

      {/* Main 3-panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 260px', height: 'calc(100vh - 57px)' }}>

        {/* === LEFT: Pending Feed === */}
        <div style={{ borderRight: '1px solid #1e1e2e', overflow: 'auto', background: '#0f0f15' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e2e' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Pending Review ({pending.length})
            </p>
          </div>
          {pending.length === 0 ? (
            <div style={{ padding: 24, color: '#4a4a6a', fontSize: 13, textAlign: 'center' }}>
              All caught up. Nothing pending.
            </div>
          ) : (
            pending.map((p) => (
              <button
                key={p.id}
                id={`admin-pending-${p.id}`}
                onClick={() => { setSelected(p); setActivePanel('analysis') }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 16px',
                  background: selected?.id === p.id ? 'rgba(124,58,237,0.1)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #1e1e2e',
                  cursor: 'pointer',
                  borderLeft: selected?.id === p.id ? '3px solid #7c3aed' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{p.title}</p>
                <p style={{ fontSize: 11, color: '#6b7280' }}>{p.niche} · Score: <span style={{ color: p.trendScore > 80 ? '#22c55e' : '#f59e0b' }}>{p.trendScore}</span></p>
                {p.emotionalTrigger && (
                  <p style={{ fontSize: 10, color: '#a78bfa', marginTop: 4, fontStyle: 'italic' }}>"{p.emotionalTrigger}"</p>
                )}
              </button>
            ))
          )}

          {/* Approved — ready to queue */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e2e', marginTop: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Approved ({approved.length})
            </p>
          </div>
          {approved.map((p) => (
            <div
              key={p.id}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #1e1e2e',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{p.title}</p>
                <p style={{ fontSize: 11, color: '#6b7280' }}>{p.niche}</p>
              </div>
              <button
                id={`admin-queue-${p.id}`}
                onClick={() => handleQueueForPublish(p)}
                disabled={loading}
                style={{
                  background: 'rgba(124,58,237,0.15)',
                  border: '1px solid rgba(124,58,237,0.4)',
                  color: '#a78bfa',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                + Queue
              </button>
            </div>
          ))}
        </div>

        {/* === CENTER: Product Analysis === */}
        <div style={{ overflow: 'auto', padding: 32 }}>
          {!selected ? (
            <div style={{ textAlign: 'center', paddingTop: 80, color: '#4a4a6a' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>🔍</p>
              <p style={{ fontSize: 16, fontWeight: 600 }}>Select a product to inspect</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>The AI analysis and pain narrative will appear here.</p>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span
                    style={{
                      background: statusColor[selected.validationStatus],
                      borderRadius: 999,
                      width: 8,
                      height: 8,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {selected.source} · {selected.niche} · Trend Score: {selected.trendScore}
                  </span>
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 6 }}>
                  {selected.title}
                </h1>
                <p style={{ fontSize: 14, color: '#6b7280' }}>
                  ${selected.price.toFixed(2)} · Status: <span style={{ color: statusColor[selected.validationStatus], fontWeight: 600 }}>{selected.validationStatus}</span>
                </p>
              </div>

              {/* Emotional Trigger — the hook seed */}
              {selected.emotionalTrigger && (
                <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: 20, marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    ⚡ Emotional Trigger
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#c4b5fd', lineHeight: 1.5 }}>
                    "{selected.emotionalTrigger}"
                  </p>
                  <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                    This becomes your ad hooks, headlines, and emotional copy backbone.
                  </p>
                </div>
              )}

              {/* Pain Narrative */}
              {selected.painNarrative && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                    Pain Narrative Arc
                  </p>
                  {[
                    { label: 'Why They\'re Here', text: selected.painNarrative.whyYoureHere, color: '#ef4444' },
                    { label: 'Real Cause', text: selected.painNarrative.realCause, color: '#f59e0b' },
                    { label: 'Why This Works', text: selected.painNarrative.whyThisWorks, color: '#22c55e' },
                  ].map((arc) => (
                    <div
                      key={arc.label}
                      style={{ background: '#141420', border: `1px solid ${arc.color}22`, borderLeft: `3px solid ${arc.color}`, borderRadius: 8, padding: 16, marginBottom: 12 }}
                    >
                      <p style={{ fontSize: 11, fontWeight: 700, color: arc.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{arc.label}</p>
                      <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{arc.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Ad Angles */}
              {selected.adAngles.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                    Top Ad Angles
                  </p>
                  {selected.adAngles.map((angle, i) => (
                    <div key={i} style={{ background: '#141420', border: '1px solid #1e1e2e', borderRadius: 8, padding: 14, marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'capitalize' }}>{angle.platform} · {angle.emotion}</span>
                        {angle.performanceScore && (
                          <span style={{ fontSize: 11, color: angle.performanceScore > 85 ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>
                            Score: {angle.performanceScore}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>"{angle.hook}"</p>
                      <p style={{ fontSize: 12, color: '#6b7280' }}>Pain: {angle.pain}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Review Notes */}
              {selected.validationNotes && (
                <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: 14, marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>⚠ Review Notes</p>
                  <p style={{ fontSize: 13, color: '#94a3b8' }}>{selected.validationNotes}</p>
                </div>
              )}

              {/* Notes input */}
              <div style={{ marginBottom: 20 }}>
                <label htmlFor="admin-notes" style={{ fontSize: 11, fontWeight: 700, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
                  Your Notes (optional)
                </label>
                <textarea
                  id="admin-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any concerns, follow-up checks, supplier notes..."
                  style={{
                    width: '100%',
                    minHeight: 80,
                    background: '#141420',
                    border: '1px solid #1e1e2e',
                    borderRadius: 8,
                    padding: 12,
                    color: '#e2e8f0',
                    fontSize: 13,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Decision buttons — only show for pending products */}
              {selected.validationStatus === 'pending' && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    id={`admin-approve-${selected.id}`}
                    onClick={() => handleApprove(selected)}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '12px 20px',
                      background: 'rgba(34,197,94,0.12)',
                      border: '1px solid rgba(34,197,94,0.4)',
                      borderRadius: 8,
                      color: '#4ade80',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    id={`admin-reject-${selected.id}`}
                    onClick={() => handleReject(selected)}
                    disabled={loading}
                    style={{
                      padding: '12px 20px',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 8,
                      color: '#f87171',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* === RIGHT: Publish Queue === */}
        <div style={{ borderLeft: '1px solid #1e1e2e', overflow: 'auto', background: '#0f0f15' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e2e' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Publish Queue ({queued.length})
            </p>
          </div>

          {queued.length === 0 ? (
            <div style={{ padding: 24, color: '#4a4a6a', fontSize: 12, textAlign: 'center' }}>
              <p style={{ marginBottom: 8 }}>📤</p>
              <p>Queue approved products here before publishing.</p>
              <p style={{ marginTop: 8, color: '#374151' }}>Batching prevents accidental single publishes.</p>
            </div>
          ) : (
            <>
              {queued.map((p) => (
                <div
                  key={p.id}
                  style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e2e' }}
                >
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{p.title}</p>
                  <p style={{ fontSize: 11, color: '#a78bfa' }}>{p.niche} · Ready to publish</p>
                </div>
              ))}
              <div style={{ padding: 16 }}>
                <button
                  id="admin-publish-all"
                  onClick={handlePublishAll}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    border: 'none',
                    borderRadius: 8,
                    color: 'white',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                  }}
                >
                  🚀 Publish All ({queued.length})
                </button>
                <p style={{ fontSize: 11, color: '#4a4a6a', textAlign: 'center', marginTop: 8 }}>
                  This goes live immediately
                </p>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
