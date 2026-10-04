'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface ActivePage {
  path: string
  count: number
}

interface TopPage {
  path: string
  views: number
}

interface RecentView {
  id: string
  path: string
  referrer: string | null
  createdAt: string
}

interface LiveAnalyticsData {
  activeNow: number
  visitorsPast3Hours: number
  pageviewsPast3Hours: number
  activePages: ActivePage[]
  topPages: TopPage[]
  recentViews: RecentView[]
  serverTime: string
}

export default function LiveTrafficTrackerWidget() {
  const [data, setData] = useState<LiveAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [error, setError] = useState<string | null>(null)

  const fetchLiveStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics/live', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch live stats')
      const json = await res.json()
      setData(json)
      setLastRefreshed(new Date())
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error loading live tracker')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-refresh every 5 seconds
  useEffect(() => {
    fetchLiveStats()
    const interval = setInterval(fetchLiveStats, 5000)
    return () => clearInterval(interval)
  }, [fetchLiveStats])

  const activeNow = data?.activeNow ?? 0
  const visitors3h = data?.visitorsPast3Hours ?? 0
  const pageviews3h = data?.pageviewsPast3Hours ?? 0
  const activePages = data?.activePages ?? []
  const topPages = data?.topPages ?? []

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #10101a 0%, #0a0914 100%)',
        border: '1px solid rgba(168, 85, 247, 0.25)',
        borderRadius: 14,
        padding: '20px 24px',
        marginBottom: 24,
        boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.6), 0 0 20px -6px rgba(168, 85, 247, 0.15)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background glow accent */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          paddingBottom: 14,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Pulsating Emerald Live Indicator */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span
              style={{
                position: 'absolute',
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#22c55e',
                opacity: 0.75,
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
            <span
              style={{
                position: 'relative',
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-0.01em' }}>
                Real-Time Traffic Monitor
              </h2>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#4ade80',
                  padding: '2px 7px',
                  borderRadius: 999,
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                LIVE PULSE
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              Auto-updating every 5s • Last ping: {lastRefreshed.toLocaleTimeString()}
            </div>
          </div>
        </div>

        <button
          onClick={fetchLiveStats}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
            borderRadius: 6,
            padding: '5px 12px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 16,
        }}
      >
        {/* Metric 1: Currently Viewing (Live Now) */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.03) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 10,
            padding: '16px 18px',
            position: 'relative',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            🟢 Viewing Right Now
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 34, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {activeNow}
            </span>
            <span style={{ fontSize: 13, color: '#86efac', fontWeight: 700 }}>
              {activeNow === 1 ? 'person' : 'people'} active
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
            Active within the last 3 minutes
          </div>
        </div>

        {/* Metric 2: Unique Visitors Past 3 Hours */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(99, 102, 241, 0.03) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 10,
            padding: '16px 18px',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            ⏱️ Visitors Past 3 Hours
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 34, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {visitors3h}
            </span>
            <span style={{ fontSize: 13, color: '#7dd3fc', fontWeight: 700 }}>
              unique visitors
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
            Rolling 180-minute window
          </div>
        </div>

        {/* Metric 3: Page Views Past 3 Hours */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(236, 72, 153, 0.03) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            borderRadius: 10,
            padding: '16px 18px',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            📄 Total Hits Past 3 Hours
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 34, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {pageviews3h}
            </span>
            <span style={{ fontSize: 13, color: '#d8b4fe', fontWeight: 700 }}>
              pageviews
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
            {visitors3h > 0 ? (pageviews3h / visitors3h).toFixed(1) : '0'} pages/visitor
          </div>
        </div>
      </div>

      {/* Live Active Breakdown & Top Pages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {/* Active Now Pages */}
        <div
          style={{
            background: '#0a0a12',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 8,
            padding: '12px 14px',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
            Current Active Pages ({activePages.length})
          </div>
          {activePages.length === 0 ? (
            <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', padding: '6px 0' }}>
              No active visitors in the last 3 minutes
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activePages.map((ap, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      color: '#e2e8f0',
                      fontFamily: 'monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '75%',
                    }}
                    title={ap.path}
                  >
                    {ap.path}
                  </span>
                  <span
                    style={{
                      background: 'rgba(34, 197, 94, 0.2)',
                      color: '#4ade80',
                      fontWeight: 800,
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 999,
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                    }}
                  >
                    {ap.count} live
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Pages Past 3 Hours */}
        <div
          style={{
            background: '#0a0a12',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 8,
            padding: '12px 14px',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
            Top Pages (Past 3 Hours)
          </div>
          {topPages.length === 0 ? (
            <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', padding: '6px 0' }}>
              No visits recorded yet in the past 3 hours
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topPages.map((tp, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      color: '#cbd5e1',
                      fontFamily: 'monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '75%',
                    }}
                    title={tp.path}
                  >
                    {tp.path}
                  </span>
                  <span
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      fontWeight: 800,
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 999,
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                    }}
                  >
                    {tp.views} views
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
