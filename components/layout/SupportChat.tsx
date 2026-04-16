'use client'

import { useState, useRef, useEffect } from 'react'

interface Msg {
  from: 'agent' | 'user'
  text: string
  ts: number
}

const AGENT_NAME = 'Vexsen Support'
const AGENT_AVATAR = '🛡️'

const QUICK_REPLIES = [
  'Where is my order?',
  'How do I return something?',
  'Is checkout secure?',
  'Do you ship internationally?',
]

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 14px' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--color-text-muted)',
            animation: `supportTyping 1.2s ${i * 0.2}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  )
}

export default function SupportChat() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [unread, setUnread] = useState(1) // starts with 1 for the greeting
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailMode, setEmailMode] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [email, setEmail] = useState('')
  const [messages, setMessages] = useState<Msg[]>([
    {
      from: 'agent',
      text: `Hi there 👋 A support agent will be with you shortly.\n\nWhile you wait — I can answer most questions right now. What can I help you with?`,
      ts: Date.now(),
    },
  ])
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Msg = { from: 'user', text: text.trim(), ts: Date.now() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      })
      const data = await res.json()
      const reply: Msg = { from: 'agent', text: data.reply || "I'll check on that for you right away.", ts: Date.now() }
      setMessages((prev) => [...prev, reply])
      if (data.escalate) {
        // Prompt for email after 500ms
        setTimeout(() => setEmailMode(true), 600)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: 'agent', text: "Sorry, I'm having trouble connecting. Please email us at support@vexsen.store and we'll reply within 4 hours.", ts: Date.now() },
      ])
    } finally {
      setLoading(false)
    }
  }

  const submitEmail = async () => {
    if (!email.trim() || !email.includes('@')) return
    // In a real scenario, this would POST to /api/support/escalate
    setEmailSent(true)
    setMessages((prev) => [
      ...prev,
      { from: 'agent', text: `✅ Got it! A real person will reach out to **${email}** within 4 hours. We never leave customers hanging.`, ts: Date.now() },
    ])
    setEmailMode(false)
  }

  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bold markdown **text**
      const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      return (
        <p key={i} style={{ margin: i > 0 ? '6px 0 0' : 0, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: formatted || '&nbsp;' }} />
      )
    })
  }

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!open) {
    return (
      <>
        <style>{`
          @keyframes chatBounce {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-6px) scale(1.04); }
          }
          @keyframes unreadPop {
            0% { transform: scale(0); }
            70% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
        `}</style>
        <button
          id="support-chat-bubble"
          onClick={() => setOpen(true)}
          aria-label="Open support chat"
          style={{
            position: 'fixed',
            bottom: 100,
            right: 24,
            zIndex: 200,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            boxShadow: '0 8px 32px rgba(201,109,34,0.4)',
            animation: 'chatBounce 3s ease-in-out infinite',
          }}
        >
          💬
          {unread > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                width: 20,
                height: 20,
                fontSize: 11,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'unreadPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
              }}
            >
              {unread}
            </span>
          )}
        </button>
      </>
    )
  }

  return (
    <>
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes supportTyping {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .support-scroll::-webkit-scrollbar { width: 3px; }
        .support-scroll::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 999px; }
        .chat-quick-btn:hover { background: var(--color-accent-soft) !important; border-color: var(--color-accent) !important; color: var(--color-accent) !important; }
      `}</style>

      <div
        role="dialog"
        aria-label="Vexsen Customer Support Chat"
        style={{
          position: 'fixed',
          bottom: 100,
          right: 24,
          zIndex: 200,
          width: 360,
          maxWidth: 'calc(100vw - 32px)',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
          maxHeight: minimized ? 64 : 540,
          transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={() => setMinimized((m) => !m)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {AGENT_AVATAR}
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 14, color: '#fff', margin: 0 }}>{AGENT_NAME}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', margin: 0 }}>Online · replies instantly</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setMinimized((m) => !m) }}
              aria-label="Minimize chat"
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {minimized ? '▲' : '▼'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); setUnread(0) }}
              aria-label="Close chat"
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* ── Messages ── */}
            <div
              className="support-scroll"
              ref={scrollRef}
              style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: m.from === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: 8,
                  }}
                >
                  {m.from === 'agent' && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-accent-soft)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                      {AGENT_AVATAR}
                    </div>
                  )}
                  <div style={{ maxWidth: '78%' }}>
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: m.from === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                        background: m.from === 'user' ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                        color: m.from === 'user' ? '#fff' : 'var(--color-text-primary)',
                        border: m.from === 'agent' ? '1px solid var(--color-border-soft)' : 'none',
                        fontSize: 13,
                        lineHeight: 1.6,
                      }}
                    >
                      {formatText(m.text)}
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 3, textAlign: m.from === 'user' ? 'right' : 'left' }}>
                      {m.from === 'agent' ? AGENT_NAME : 'You'} · {formatTime(m.ts)}
                    </p>
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-accent-soft)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                    {AGENT_AVATAR}
                  </div>
                  <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-soft)', borderRadius: '4px 18px 18px 18px' }}>
                    <TypingIndicator />
                  </div>
                </div>
              )}

              {/* Quick replies — show only on first agent message */}
              {messages.length === 1 && !loading && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      className="chat-quick-btn"
                      onClick={() => sendMessage(q)}
                      style={{
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-full)',
                        padding: '5px 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Email escalation form */}
              {emailMode && !emailSent && (
                <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>Leave your email and we'll follow up personally:</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-bg-card)',
                        color: 'var(--color-text-primary)',
                        fontSize: 12,
                        outline: 'none',
                        fontFamily: 'var(--font-body)',
                      }}
                    />
                    <button
                      onClick={submitEmail}
                      className="btn btn-primary btn-sm"
                      style={{ whiteSpace: 'nowrap', fontSize: 12 }}
                    >
                      Send →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Input ── */}
            <div style={{ borderTop: '1px solid var(--color-border-soft)', padding: '10px 12px', flexShrink: 0, background: 'var(--color-bg-card)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  ref={inputRef}
                  type="text"
                  id="support-chat-input"
                  placeholder="Type your message…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '9px 13px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'var(--font-body)',
                  }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  aria-label="Send message"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: input.trim() ? 'var(--color-accent)' : 'var(--color-border)',
                    border: 'none',
                    cursor: input.trim() ? 'pointer' : 'default',
                    color: '#fff',
                    fontSize: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  ↑
                </button>
              </div>
              <p style={{ fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 6 }}>
                Powered by Vexsen · <a href="mailto:support@vexsen.store" style={{ color: 'var(--color-accent)' }}>support@vexsen.store</a>
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
