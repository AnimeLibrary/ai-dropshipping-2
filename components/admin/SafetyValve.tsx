'use client'

interface ArchivedProduct {
  id: string
  title: string
  reason: string
}

export default function SafetyValve({ archived }: { archived: ArchivedProduct[] }) {
  return (
    <div style={{ animation: 'fadeIn 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#f59e0b' }}>Safety Valve: Profitability Guardrails</h2>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>The Margin Protector has archived these items to prevent non-profitable sales.</p>
        </div>
      </div>
      
      <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px 0' }}>Archived via Database Flag</h3>
        <div style={{ display: 'grid', gap: 12 }}>
            {archived.length === 0 ? (
                <div style={{ padding: 10, color: '#6b7280', fontSize: 12 }}>No archived products. Safety limits are clear.</div>
            ) : (
                archived.map(product => (
                    <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0c0c0f', padding: '12px 16px', borderRadius: 8, border: '1px solid #1e1e2e' }}>
                       <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{product.title}</p>
                          <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>Flagged as: {product.reason}</p>
                       </div>
                       <button style={{ background: '#1e1e2e', border: '1px solid #333', color: '#fff', fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>Review in DB</button>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  )
}
