'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AdminChatProps {
  isOpen: boolean
  onClose: () => void
  selectedProduct: any
}

export default function AdminChat({ isOpen, onClose, selectedProduct }: AdminChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Ready to strategize. I have access to your current product analysis. What would you like to know?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(userMsg),
          contextProduct: selectedProduct
        })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 400,
        background: '#11111a',
        borderLeft: '1px solid #1e1e2e',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .message-container::-webkit-scrollbar { width: 4px; }
        .message-container::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 999px; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Llama 3.1 Strategist</h2>
          <p style={{ fontSize: 11, color: '#4a4ade', margin: 0 }}>Local AI Node · Active</p>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 20 }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        className="message-container"
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: m.role === 'user' ? '#7c3aed' : '#1e1e2e',
              padding: '12px 16px',
              borderRadius: m.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
              fontSize: 14,
              lineHeight: 1.5,
              color: '#f1f5f9',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: '#6b7280', fontSize: 12, fontStyle: 'italic' }}>
            Llama is thinking...
          </div>
        )}
      </div>

      {/* Context info */}
      {selectedProduct && (
        <div style={{ padding: '10px 20px', background: 'rgba(124,58,237,0.05)', fontSize: 11, color: '#a78bfa', borderTop: '1px solid #1e1e2e' }}>
          Analyzing: <strong>{selectedProduct.title}</strong>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '20px', borderTop: '1px solid #1e1e2e' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything..."
            style={{
              flex: 1,
              background: '#0c0c0f',
              border: '1px solid #1e1e2e',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#e2e8f0',
              fontSize: 14,
              outline: 'none'
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            style={{
              background: '#7c3aed',
              border: 'none',
              borderRadius: '8px',
              width: 40,
              height: 40,
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: loading ? 0.6 : 1
            }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
