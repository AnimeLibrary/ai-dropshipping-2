'use client'

interface AnalyticsGridProps {
  stats: {
    ctr: number
    conversion: number
    profit: number
  }
}

export default function AnalyticsGrid({ stats }: AnalyticsGridProps) {
  const data = [
    { label: 'CTR (Ad Efficiency)', value: `${stats.ctr}%`, color: '#60a5fa' },
    { label: 'Conv. Rate (Site Efficiency)', value: `${stats.conversion}%`, color: '#4ade80' },
    { label: 'Net Profit (Est.)', value: `$${stats.profit.toLocaleString()}`, color: '#a78bfa' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
      {data.map((item) => (
        <div
          key={item.label}
          style={{
            background: 'rgba(30, 30, 46, 0.4)',
            border: '1px solid #1e1e2e',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
            backdropFilter: 'blur(4px)'
          }}
        >
          <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
            {item.label}
          </p>
          <p style={{ fontSize: 24, fontWeight: 800, color: item.color, margin: 0 }}>
            {item.value}
          </p>
          <div style={{ marginTop: 12, height: 4, background: '#1e1e2e', borderRadius: 2 }}>
            <div 
              style={{ 
                height: '100%', 
                width: '60%', // Simulated progress
                background: item.color, 
                borderRadius: 2,
                boxShadow: `0 0 10px ${item.color}44`
              }} 
            />
          </div>
        </div>
      ))}
    </div>
  )
}
