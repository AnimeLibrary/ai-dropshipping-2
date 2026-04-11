'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AdminChatProps {
  isOpen: boolean
  onClose: () => void
  selectedProduct?: any
}

// Renders structured approval reports with formatting
function MessageContent({ content }: { content: string }) {
  // Detect approval report markers for special rendering
  const isReport = content.includes('APPROVAL REQUEST') || content.includes('PRODUCT INTEL') || content.includes('AI VERDICT')

  if (!isReport) {
    return <span style={{ lineHeight: 1.6 }}>{content}</span>
  }

  // Split into lines for structured rendering
  const lines = content.split('\n')
  return (
    <div style={{ lineHeight: 1.7 }}>
      {lines.map((line, i) => {
        if (line.startsWith('## ') || line.startsWith('# ')) {
          return <p key={i} style={{ color: '#a78bfa', fontWeight: 800, fontSize: 13, margin: '12px 0 4px', borderBottom: '1px solid #2e2e4e', paddingBottom: 4 }}>{line.replace(/^#+\s/, '')}</p>
        }
        if (line.startsWith('✅') || line.startsWith('🟢')) {
          return <p key={i} style={{ color: '#4ade80', fontWeight: 700, margin: '4px 0' }}>{line}</p>
        }
        if (line.startsWith('❌') || line.startsWith('🔴')) {
          return <p key={i} style={{ color: '#f87171', fontWeight: 700, margin: '4px 0' }}>{line}</p>
        }
        if (line.startsWith('⚠️') || line.startsWith('🟡')) {
          return <p key={i} style={{ color: '#fbbf24', fontWeight: 700, margin: '4px 0' }}>{line}</p>
        }
        if (line.includes('VERDICT:') || line.includes('APPROVE') || line.includes('REJECT')) {
          const isApprove = line.includes('APPROVE')
          return (
            <p key={i} style={{
              background: isApprove ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${isApprove ? '#22c55e44' : '#ef444444'}`,
              color: isApprove ? '#4ade80' : '#f87171',
              fontWeight: 800, fontSize: 13, padding: '6px 12px', borderRadius: 6, margin: '8px 0'
            }}>{line}</p>
          )
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <p key={i} style={{ color: '#94a3b8', margin: '2px 0', paddingLeft: 8 }}>{line}</p>
        }
        if (line.trim() === '') return <br key={i} />
        return <p key={i} style={{ color: '#e2e8f0', margin: '2px 0' }}>{line}</p>
      })}
    </div>
  )
}

export default function AdminChat({ isOpen, onClose, selectedProduct }: AdminChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `## 🤖 Vexsen AI Agent — Online\n\nI have full authority over your store database. Here is what I can do:\n\n- **Import CSV data** — Paste Kalodata or Minea CSV exports directly here\n- **Deep analyze products** — Market saturation, margin, supplier intel, ad angles\n- **Approve / Reject** — I'll make a recommendation and await your final call\n- **Live metrics** — Ask me "what's my store status?" anytime\n\nReady. Paste your data or give me a command.`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [thinkingStage, setThinkingStage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, thinkingStage])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setThinkingStage('Parsing your request...')

    try {
      // Detect if user is pasting CSV to show better loading state
      const isCSV = input.includes(',') && input.split('\n').length > 3
      if (isCSV) setThinkingStage('📊 Detected CSV data — importing to database...')

      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(userMsg).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await res.json()

      if (data.error) throw new Error(data.error)
      if (data.iterations && data.iterations > 1) {
        setThinkingStage(`Completed ${data.iterations} analysis operations...`)
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ **Agent Error**: ${err.message}\n\nEnsure LM Studio is running at \`http://127.0.0.1:1234\` with the Llama 3.1 8B model loaded.`
      }])
    } finally {
      setLoading(false)
      setThinkingStage('')
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: 480,
      background: '#0d0d14',
      borderLeft: '1px solid #1e1e2e',
      display: 'flex', flexDirection: 'column',
      zIndex: 1000,
      boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pulse { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
        .msg-scroll::-webkit-scrollbar { width: 3px; }
        .msg-scroll::-webkit-scrollbar-thumb { background: #2e2e4e; border-radius: 999px; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(124,58,237,0.06)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Vexsen AI Agent</h2>
          </div>
          <p style={{ fontSize: 10, color: '#7c3aed', margin: '2px 0 0', fontWeight: 700, letterSpacing: '0.05em' }}>
            LLAMA 3.1 8B · LOCAL · FULL AUTHORITY MODE
          </p>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 18, padding: 4 }}>✕</button>
      </div>

      {/* CSV Quick Tip */}
      <div style={{ padding: '8px 20px', background: 'rgba(59,130,246,0.06)', borderBottom: '1px solid #1e1e2e', fontSize: 10, color: '#60a5fa' }}>
        💡 <strong>Tip:</strong> Paste any Kalodata or Minea CSV export directly into the chat — AI will auto-import and analyze
      </div>

      {/* Messages */}
      <div className="msg-scroll" ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '92%',
            background: m.role === 'user' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : '#141420',
            border: m.role === 'assistant' ? '1px solid #1e1e2e' : 'none',
            padding: '14px 18px',
            borderRadius: m.role === 'user' ? '18px 18px 2px 18px' : '4px 18px 18px 18px',
            fontSize: 13,
            color: '#f1f5f9',
            boxShadow: m.role === 'user' ? '0 4px 20px rgba(124,58,237,0.3)' : '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            <MessageContent content={m.content} />
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: 'flex-start', background: '#141420', border: '1px solid #1e1e2e', padding: '14px 18px', borderRadius: '4px 18px 18px 18px', maxWidth: '85%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', animation: `pulse 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>{thinkingStage || 'Agent thinking...'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '16px', borderTop: '1px solid #1e1e2e' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
            placeholder="Paste CSV, URL, or command... (Shift+Enter for new line)"
            rows={3}
            style={{
              flex: 1,
              background: '#0c0c0f',
              border: '1px solid #2e2e4e',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#e2e8f0',
              fontSize: 13,
              outline: 'none',
              resize: 'none',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.5
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              background: loading ? '#1e1e2e' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              border: 'none',
              borderRadius: '10px',
              width: 44, height: 44,
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
              opacity: loading ? 0.5 : 1,
              flexShrink: 0
            }}
          >→</button>
        </div>
        <p style={{ fontSize: 10, color: '#4a4a6a', margin: '8px 0 0', textAlign: 'center' }}>
          Commands: paste CSV · "approve [id]" · "reject [id] [reason]" · "store status"
        </p>
      </div>
    </div>
  )
}
