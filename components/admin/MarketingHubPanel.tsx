'use client'

import { useState } from 'react'

interface Props {
  card: React.CSSProperties
  label: React.CSSProperties
  showToast: (msg: string, type?: 'ok' | 'err') => void
  setLoadingId: (id: string | null) => void
  loadingId: string | null
}

const ACCENT = '#f43f5e'
const GREEN  = '#22c55e'
const BLUE   = '#3b82f6'
const PURPLE = '#a78bfa'
const YELLOW = '#f59e0b'
const TEAL   = '#14b8a6'

function EngineCard({ icon, title, subtitle, desc, status, statusLabel, statusColor, actions }: {
  icon: string; title: string; subtitle: string; desc: string
  status: 'live' | 'ready' | 'idle'
  statusLabel: string; statusColor: string
  actions: { label: string; color: string; loading?: boolean; onClick: () => void }[]
}) {
  const statusBg: Record<string, string>     = { live: '#22c55e22', ready: '#f59e0b22', idle: '#6b728022' }
  const statusBorder: Record<string, string> = { live: '#22c55e44', ready: '#f59e0b44', idle: '#6b728044' }
  return (
    <div style={{ background:'#111118', border:'1px solid #1e1e2e', borderRadius:14, padding:'18px 20px', display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div style={{ fontSize:26, width:44, height:44, borderRadius:10, background:'#1e1e2e', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</div>
          <div>
            <div style={{ fontWeight:800, fontSize:14, color:'#e2e8f0', letterSpacing:'-0.01em' }}>{title}</div>
            <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>{subtitle}</div>
          </div>
        </div>
        <span style={{ background:statusBg[status], border:`1px solid ${statusBorder[status]}`, color:statusColor, borderRadius:999, fontSize:10, padding:'3px 10px', fontWeight:800, whiteSpace:'nowrap' as const, letterSpacing:'0.05em', textTransform:'uppercase' as const }}>{statusLabel}</span>
      </div>
      <p style={{ fontSize:12, color:'#94a3b8', margin:0, lineHeight:'1.6' }}>{desc}</p>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' as const }}>
        {actions.map((a, i) => (
          <button key={i} onClick={a.onClick} disabled={a.loading} style={{ background:`${a.color}18`, border:`1px solid ${a.color}44`, color:a.color, borderRadius:7, padding:'7px 16px', cursor:a.loading ? 'not-allowed' : 'pointer', fontWeight:700, fontSize:12, opacity:a.loading ? 0.7 : 1, transition:'all 0.15s ease' }}>
            {a.loading ? '⏳ Running...' : a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function MarketingHubPanel({ card, label, showToast, setLoadingId, loadingId }: Props) {
  const [tiktokCopied, setTiktokCopied] = useState(false)
  const [googleCopied, setGoogleCopied] = useState(false)
  const [botTarget, setBotTarget] = useState('vexsen')
  const [botCount, setBotCount] = useState(2)
  const [botResult, setBotResult] = useState<string | null>(null)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vexsen.com'

  const copyFeed = (type: 'tiktok' | 'google') => {
    const url = type === 'tiktok' ? `${baseUrl}/api/feeds/tiktok-catalog` : `${baseUrl}/api/feeds/google-merchant`
    navigator.clipboard.writeText(url)
    if (type === 'tiktok') { setTiktokCopied(true); setTimeout(() => setTiktokCopied(false), 2000) }
    else { setGoogleCopied(true); setTimeout(() => setGoogleCopied(false), 2000) }
    showToast(`Copied: ${url}`)
  }

  const fire = async (id: string, endpoint: string, successMsg: string) => {
    setLoadingId(id)
    try {
      const res  = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      showToast(successMsg)
    } catch (err: any) {
      showToast(err.message || 'Failed', 'err')
    } finally {
      setLoadingId(null)
    }
  }

  const runEngagement = async (createAccounts: boolean) => {
    const id = 'engagement-bot'
    setLoadingId(id)
    setBotResult(null)
    try {
      const cleanTarget = botTarget.replace(/^@/, '').trim() || 'vexsen'
      const payload = createAccounts
        ? { target: cleanTarget, count: botCount }
        : { target: cleanTarget, count: 0, wave: true }

      const res = await fetch('/api/admin/marketing/run-engagement-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Engagement run failed')
      setBotResult(data.message || 'Done!')
      showToast(data.message || 'Engagement wave finished!')
    } catch (err: any) {
      showToast(err.message || 'Failed', 'err')
      setBotResult(`Error: ${err.message}`)
    } finally {
      setLoadingId(null)
    }
  }

  const kpis = [
    { label:'Catalog Feed',    value:'LIVE',      color:GREEN,  desc:'/api/feeds/tiktok-catalog' },
    { label:'TikTok Videos',   value:'3 Ready',   color:PURPLE, desc:'In /video_output/' },
    { label:'Pinterest Pins',  value:'4 Rendered',color:ACCENT, desc:'In /pinterest_output/' },
    { label:'IndexNow',        value:'Submitted', color:TEAL,   desc:'8 pages indexed' },
    { label:'Batch Factory',   value:'4 Angles',  color:YELLOW, desc:'Anti-hash unique clips' },
    { label:'Engagement Bot',  value:'ACTIVE',    color:GREEN,  desc:'Auto-engagement network' },
  ]

  const setupSteps = [
    { ch:'TikTok Ads Manager', color:TEAL, steps:['Assets → Catalog → Connect Feed','Paste TikTok Feed URL','Refresh: Every Hour','Launch Dynamic Showcase Ads'] },
    { ch:'Google Merchant',    color:BLUE, steps:['Products → Feeds → Add Feed','Paste Google Feed URL','Schedule: Hourly','Launch Shopping campaigns'] },
    { ch:'Organic TikTok',     color:ACCENT, steps:['Run batch factory → 4 MP4s','Open tiktok_growth_output/ for captions','Post 1/day on 7-day calendar','Pin the comment script on each post'] },
    { ch:'Pinterest',          color:'#e8823a', steps:['Run Pinterest generator','Open Business → Bulk Upload','Upload the generated CSV','Pins compound for 2-3 years'] },
  ]

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:900, margin:0, color:ACCENT, display:'flex', alignItems:'center', gap:10 }}>
          🔥 Marketing Growth Hub
        </h1>
        <p style={{ color:'#94a3b8', fontSize:13, margin:'8px 0 0' }}>
          6 active promotion engines — TikTok feeds, video factory, Pinterest, IndexNow, caption engine & engagement bot.
        </p>
      </div>

      {/* KPI Strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(155px,1fr))', gap:10, marginBottom:24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ ...card, padding:'12px 16px', marginBottom:0, borderLeft:`3px solid ${k.color}` }}>
            <div style={{ fontSize:10, fontWeight:800, color:'#4a4a6a', textTransform:'uppercase' as const, letterSpacing:'0.08em', marginBottom:4 }}>{k.label}</div>
            <div style={{ fontSize:17, fontWeight:900, color:k.color }}>{k.value}</div>
            <div style={{ fontSize:10, color:'#6b7280', marginTop:2 }}>{k.desc}</div>
          </div>
        ))}
      </div>

      {/* Engine Cards Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(430px,1fr))', gap:14, marginBottom:24 }}>

        {/* Catalog Feed Card */}
        <div style={{ background:'#111118', border:'1px solid #1e1e2e', borderRadius:14, padding:'18px 20px', display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <div style={{ fontSize:26, width:44, height:44, borderRadius:10, background:'#1e1e2e', display:'flex', alignItems:'center', justifyContent:'center' }}>📡</div>
              <div>
                <div style={{ fontWeight:800, fontSize:14, color:'#e2e8f0' }}>TikTok & Google Catalog Feeds</div>
                <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>Live XML feeds for Ads Manager & Merchant Center</div>
              </div>
            </div>
            <span style={{ background:'#22c55e22', border:'1px solid #22c55e44', color:GREEN, borderRadius:999, fontSize:10, padding:'3px 10px', fontWeight:800, textTransform:'uppercase' as const }}>LIVE</span>
          </div>
          <p style={{ fontSize:12, color:'#94a3b8', margin:0, lineHeight:'1.6' }}>Plug into TikTok Ads → Catalog or Google Merchant → Feeds. Products + variants auto-update hourly.</p>
          <div style={{ background:'#0c0c0f', border:'1px solid #1e1e2e', borderRadius:8, padding:'10px 14px', fontSize:11, fontFamily:'monospace', color:'#94a3b8' }}>
            <div style={{ marginBottom:4 }}><span style={{ color:TEAL }}>TikTok: </span>{baseUrl}/api/feeds/tiktok-catalog</div>
            <div><span style={{ color:BLUE }}>Google: </span>{baseUrl}/api/feeds/google-merchant</div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' as const }}>
            <button onClick={() => copyFeed('tiktok')} style={{ background:`${TEAL}18`, border:`1px solid ${TEAL}44`, color:TEAL, borderRadius:7, padding:'7px 14px', cursor:'pointer', fontWeight:700, fontSize:11 }}>
              {tiktokCopied ? '✓ Copied!' : '📋 Copy TikTok URL'}
            </button>
            <button onClick={() => copyFeed('google')} style={{ background:`${BLUE}18`, border:`1px solid ${BLUE}44`, color:BLUE, borderRadius:7, padding:'7px 14px', cursor:'pointer', fontWeight:700, fontSize:11 }}>
              {googleCopied ? '✓ Copied!' : '📋 Copy Google URL'}
            </button>
            <button onClick={() => window.open(`/api/feeds/tiktok-catalog`, '_blank')} style={{ background:'#1e1e2e', border:'1px solid #2e2e4e', color:'#9ca3af', borderRadius:7, padding:'7px 14px', cursor:'pointer', fontWeight:700, fontSize:11 }}>
              👁 Preview Feed ↗
            </button>
          </div>
        </div>

        {/* IndexNow */}
        <EngineCard icon="⚡" title="IndexNow Instant Crawl" subtitle="Bing · Yandex · Seznam · Naver — forces crawl in 10–60 min"
          desc="Bypasses the 2–4 week wait time. Fires all product pages, guide pages, and SEO clusters at the search engine crawl queue simultaneously. Run every time you add new products or guides."
          status="ready" statusLabel="Ready to Fire" statusColor={YELLOW}
          actions={[{ label:'⚡ Submit All URLs Now', color:YELLOW, loading:loadingId==='indexnow', onClick:() => fire('indexnow', '/api/admin/marketing/indexnow', '⚡ All URLs instantly submitted to search engines!') }]}
        />

        {/* Batch Video Factory */}
        <EngineCard icon="🎬" title="Anti-Hash Batch Video Factory" subtitle="4 viral angles · unique voice · micro-zoom drift · varied BPM"
          desc="Renders 4 unique 9:16 TikTok ads — Sephora Dupe callout, 14-Hour Wear Test, Satisfying Peel Reveal, and Restock Alert. Each has a different TTS accent, varied BPM beat, and micro-zoom crop so TikTok's duplicate hash detection treats every clip as original."
          status="ready" statusLabel="4 Angles Ready" statusColor={PURPLE}
          actions={[
            { label:'🎬 Launch Video Factory', color:PURPLE, loading:loadingId==='batch-video', onClick:() => fire('batch-video', '/api/admin/marketing/batch-videos', '🎬 4 unique TikTok video ads queued for export!') },
            { label:'📂 Output Folder', color:'#6b7280', onClick:() => showToast('Check: scripts/video_output/batch/') },
          ]}
        />

        {/* Pinterest */}
        <EngineCard icon="📌" title="Pinterest Pin Mass Generator" subtitle="1000×1500 premium pins + bulk CSV for scheduling"
          desc="Creates high-converting aesthetic Pinterest pin cards per product with viral beauty keywords. Pinterest traffic indexes in Google Images and Pinterest search for 2–3 years — this is permanent compounding free traffic that builds on itself."
          status="ready" statusLabel="4 Pins Ready" statusColor={ACCENT}
          actions={[
            { label:'🎨 Render All Pins', color:ACCENT, loading:loadingId==='pinterest', onClick:() => fire('pinterest', '/api/admin/marketing/pinterest', '🎨 4 Pinterest pins rendered + CSV ready!') },
            { label:'📂 Open Output', color:'#6b7280', onClick:() => showToast('Check: scripts/pinterest_output/pins/') },
          ]}
        />

        {/* TikTok Caption Engine */}
        <EngineCard icon="✍️" title="TikTok Viral Caption Engine" subtitle="20+ captions · live hashtag scouting · 7-day calendar"
          desc="Scrapes live trending beauty hashtags and generates 20+ ready-to-post captions in Pattern Interrupt, POV, Controversy, Transformation, and Urgency formats — plus pinned comment scripts to boost the engagement rate in the first hour after posting."
          status="ready" statusLabel="Ready" statusColor={GREEN}
          actions={[
            { label:'✍️ Generate Captions & Calendar', color:GREEN, loading:loadingId==='tiktok-captions', onClick:() => fire('tiktok-captions', '/api/admin/marketing/tiktok-captions', '🎯 20+ viral captions generated with 7-day calendar!') },
            { label:'📂 View Output', color:'#6b7280', onClick:() => showToast('Check: scripts/tiktok_growth_output/') },
          ]}
        />

        {/* Engagement Bot */}
        <div style={{ background:'#111118', border:`1px solid ${GREEN}33`, borderRadius:14, padding:'18px 20px', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <div style={{ fontSize:26, width:44, height:44, borderRadius:10, background:'#1e1e2e', display:'flex', alignItems:'center', justifyContent:'center' }}>🤖</div>
              <div>
                <div style={{ fontWeight:800, fontSize:14, color:'#e2e8f0' }}>TikTok Auto-Account & Engagement Bot</div>
                <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>Creates burner accounts with temp emails & boosts your target handle</div>
              </div>
            </div>
            <span style={{ background:`${GREEN}22`, border:`1px solid ${GREEN}44`, color:GREEN, borderRadius:999, fontSize:10, padding:'3px 10px', fontWeight:800, textTransform:'uppercase' as const }}>AUTOMATED</span>
          </div>

          <p style={{ fontSize:12, color:'#94a3b8', margin:0, lineHeight:'1.6' }}>
            Creates fresh burner accounts using throwaway mailboxes, registers them, and triggers watch time, likes, comments, and shares to boost early FYP ranking signals.
          </p>

          {/* Target & Count Controls */}
          <div style={{ background:'#0c0c0f', border:'1px solid #1e1e2e', borderRadius:10, padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' as const }}>
              <div style={{ flex:1, minWidth:200 }}>
                <label style={{ fontSize:10, fontWeight:700, color:'#94a3b8', display:'block', marginBottom:4, textTransform:'uppercase' as const, letterSpacing:'0.05em' }}>
                  Target TikTok Handle
                </label>
                <div style={{ display:'flex', alignItems:'center', background:'#14141f', border:'1px solid #2e2e4e', borderRadius:6, padding:'4px 8px' }}>
                  <span style={{ color:'#6b7280', fontSize:13, fontWeight:700, marginRight:2 }}>@</span>
                  <input
                    type="text"
                    value={botTarget}
                    onChange={(e) => setBotTarget(e.target.value)}
                    placeholder="vexsen"
                    style={{ background:'transparent', border:'none', color:'#f8fafc', fontSize:12, outline:'none', width:'100%', fontWeight:600 }}
                  />
                </div>
              </div>

              <div style={{ width:140 }}>
                <label style={{ fontSize:10, fontWeight:700, color:'#94a3b8', display:'block', marginBottom:4, textTransform:'uppercase' as const, letterSpacing:'0.05em' }}>
                  Accounts to Create
                </label>
                <div style={{ display:'flex', gap:4 }}>
                  {[1, 2, 3, 5].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setBotCount(cnt)}
                      style={{
                        flex:1,
                        background: botCount === cnt ? `${GREEN}28` : '#14141f',
                        border: `1px solid ${botCount === cnt ? GREEN : '#2e2e4e'}`,
                        color: botCount === cnt ? GREEN : '#94a3b8',
                        borderRadius:6,
                        padding:'5px 0',
                        fontSize:11,
                        fontWeight:700,
                        cursor:'pointer'
                      }}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {botResult && (
              <div style={{ background:'#181824', border:`1px solid ${botResult.startsWith('Error') ? '#ef444455' : `${GREEN}44`}`, borderRadius:6, padding:'8px 12px', fontSize:11, color:botResult.startsWith('Error') ? '#f87171' : GREEN, display:'flex', alignItems:'center', gap:8 }}>
                <span>{botResult.startsWith('Error') ? '❌' : '✅'}</span>
                <span>{botResult}</span>
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:8, flexWrap:'wrap' as const }}>
            <button
              onClick={() => runEngagement(true)}
              disabled={loadingId === 'engagement-bot'}
              style={{
                background: `${GREEN}22`,
                border: `1px solid ${GREEN}55`,
                color: GREEN,
                borderRadius:7,
                padding:'8px 16px',
                cursor: loadingId === 'engagement-bot' ? 'not-allowed' : 'pointer',
                fontWeight:800,
                fontSize:12,
                opacity: loadingId === 'engagement-bot' ? 0.7 : 1,
                display:'flex',
                alignItems:'center',
                gap:6
              }}
            >
              {loadingId === 'engagement-bot' ? '⏳ Generating & Engaging...' : `⚡ Auto-Create ${botCount} Accounts & Boost @${botTarget.replace(/^@/, '') || 'vexsen'}`}
            </button>

            <button
              onClick={() => runEngagement(false)}
              disabled={loadingId === 'engagement-bot'}
              style={{
                background: '#1a1a28',
                border: '1px solid #2e2e4e',
                color: '#e2e8f0',
                borderRadius:7,
                padding:'8px 16px',
                cursor: loadingId === 'engagement-bot' ? 'not-allowed' : 'pointer',
                fontWeight:700,
                fontSize:11,
                opacity: loadingId === 'engagement-bot' ? 0.7 : 1
              }}
            >
              🚀 Fast Wave (Saved Accounts Only)
            </button>

            <button
              onClick={() => showToast('Configured scripts/tiktok_engagement_bot.py with mail.tm integration')}
              style={{
                background: 'transparent',
                border: '1px solid #252538',
                color: '#6b7280',
                borderRadius:7,
                padding:'8px 12px',
                cursor: 'pointer',
                fontWeight:600,
                fontSize:11
              }}
            >
              ⚙️ Bot Engine Info
            </button>
          </div>
        </div>

      </div>

      {/* Setup Guide */}
      <div style={{ ...card }}>
        <div style={{ ...label }}>📖 Channel Setup Guide</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:14, marginTop:12 }}>
          {setupSteps.map(({ ch, color, steps }) => (
            <div key={ch} style={{ background:'#0c0c0f', borderRadius:10, padding:'14px 16px', border:`1px solid ${color}22` }}>
              <div style={{ fontWeight:800, fontSize:12, color, marginBottom:10 }}>{ch}</div>
              {steps.map((s, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:10, fontWeight:900, color, background:`${color}22`, borderRadius:999, width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</span>
                  <span style={{ fontSize:11, color:'#94a3b8', lineHeight:'1.5' }}>{s}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
