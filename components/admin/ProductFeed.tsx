'use client'

import { useState } from 'react'

interface AdminProduct {
  id: string
  title: string
  niche: string
  trendScore: number
  price: number
  supplierPrice: number
  validationStatus: string
}

interface ProductFeedProps {
  pending: AdminProduct[]
  approved: AdminProduct[]
}

export default function ProductFeed({ pending: initialPending, approved: initialApproved }: ProductFeedProps) {
  const [pending, setPending] = useState(initialPending)
  const [approved, setApproved] = useState(initialApproved)

  // TODO: Add real fetch to API endpoints for /approve and /queue. For now just visual separation.

  return (
    <div style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 12, borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#4a4a6a' }}>PENDING REVIEW</span>
      </div>
      {pending.length === 0 ? <div style={{ padding: 16, color: '#6b7280', fontSize: 12 }}>No pending items</div> : null}
      {pending.map((p) => (
        <div key={p.id} style={{ width: '100%', textAlign: 'left', padding: 16, borderBottom: '1px solid #1e1e2e' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{p.title}</p>
          <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 8px' }}>{p.niche} · Score: {p.trendScore}</p>
          <button style={{ background: '#22c55e22', border: '1px solid #22c55e44', color: '#4ade80', fontSize: 10, padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>
             Approve
          </button>
        </div>
      ))}

      <div style={{ padding: 12, borderBottom: '1px solid #1e1e2e', fontSize: 11, fontWeight: 700, color: '#4a4a6a', marginTop: 10 }}>APPROVED</div>
      {approved.length === 0 ? <div style={{ padding: 16, color: '#6b7280', fontSize: 12 }}>No approved items</div> : null}
      {approved.map((p) => (
        <div key={p.id} style={{ padding: 12, borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12 }}>{p.title}</span>
          <button style={{ fontSize: 10, background: '#1e1e2e', border: '1px solid #333', color: '#ccc', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}>+ Queue</button>
        </div>
      ))}
    </div>
  )
}
