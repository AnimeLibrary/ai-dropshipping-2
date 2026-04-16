'use client'

import { SchemaMarkup, breadcrumbSchema } from '@/lib/seo/schema'

const FAQS = [
  {
    q: 'When will my order ship?',
    a: 'Orders are processed and handed to our carrier within 24–72 hours. You\'ll receive a tracking number the moment your package leaves our fulfillment center.',
  },
  {
    q: 'What is your return policy?',
    a: 'Defective or missing item → full refund, no questions. Changed your mind → 100% store credit. Either way, you never lose money at Vexsen.',
  },
  {
    q: 'Can I cancel my order?',
    a: 'Cancellations must be requested within 1 hour of purchase before fulfillment begins. Email us immediately with your order number and "CANCEL" in the subject.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Yes. All transactions are processed by Stripe (PCI-DSS Level 1). Your card details never touch our servers. We store nothing.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'Currently US-only. UK, Canada, and Australia are next. Join our email list to be the first notified when we expand.',
  },
  {
    q: 'How do I track my package?',
    a: 'A tracking link is emailed to you within 72 hours of ordering. If you haven\'t received it, check your spam folder or contact us with your order number.',
  },
]

export default function ContactPage() {
  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Contact & Support', href: '/contact' },
  ]

  return (
    <>
      <SchemaMarkup schema={breadcrumbSchema(breadcrumbs)} />

      {/* ── Hero ── */}
      <section
        style={{
          background: 'linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%)',
          borderBottom: '1px solid var(--color-border)',
          padding: 'calc(var(--nav-height) + var(--space-16)) 0 var(--space-16)',
          textAlign: 'center',
        }}
      >
        <div className="container" style={{ maxWidth: 640 }}>
          <span className="badge badge-neutral" style={{ marginBottom: 'var(--space-4)' }}>Support</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 'var(--space-4)' }}>
            We're here to help.
          </h1>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
            A real person reads every message. No ticket queues. No form letters. We respond within <strong>4 hours</strong> — often much faster.
          </p>
        </div>
      </section>

      <main id="main-content">
        <section style={{ padding: 'var(--space-16) 0' }}>
          <div className="container" style={{ maxWidth: 960 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-16)' }}>

              {/* Email card */}
              <div
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>📧</div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Email Support</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6, marginBottom: 'var(--space-5)' }}>
                  Best for order issues, returns, and anything that needs a paper trail. We respond within <strong>4 hours</strong>.
                </p>
                <a
                  href="mailto:support@vexsen.store?subject=Support Request"
                  className="btn btn-primary"
                  style={{ width: '100%', textAlign: 'center', display: 'block' }}
                >
                  Email Us →
                </a>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-3)' }}>
                  support@vexsen.store
                </p>
              </div>

              {/* Live chat card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--color-accent-soft), var(--color-bg-card))',
                  border: '1px solid rgba(201,109,34,0.25)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>💬</div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Live Chat</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6, marginBottom: 'var(--space-5)' }}>
                  Fastest way to get answers. Click the chat bubble in the bottom-right corner — we respond <strong>instantly</strong> to common questions.
                </p>
                <button
                  id="contact-open-chat-btn"
                  onClick={() => {
                    // Trigger the support chat bubble
                    const btn = document.getElementById('support-chat-bubble') as HTMLButtonElement | null
                    if (btn) btn.click()
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  Open Chat →
                </button>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-3)' }}>
                  Available 24/7 · AI + human backup
                </p>
              </div>
            </div>

            {/* ── FAQ ── */}
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 800,
                  textAlign: 'center',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Common Questions
              </h2>
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: 'var(--space-10)' }}>
                Answers to what most people ask before reaching out.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {FAQS.map((faq, i) => (
                  <details
                    key={i}
                    style={{
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                    }}
                  >
                    <summary
                      style={{
                        padding: 'var(--space-5) var(--space-6)',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 700,
                        fontSize: 'var(--text-base)',
                        cursor: 'pointer',
                        listStyle: 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {faq.q}
                      <span style={{ fontSize: 'var(--text-lg)', flexShrink: 0, marginLeft: 'var(--space-4)', color: 'var(--color-accent)' }}>+</span>
                    </summary>
                    <div style={{ padding: '0 var(--space-6) var(--space-5)', borderTop: '1px solid var(--color-border-soft)' }}>
                      <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 1.7, paddingTop: 'var(--space-4)' }}>
                        {faq.a}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* ── Still stuck ── */}
            <div
              style={{
                marginTop: 'var(--space-16)',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-10)',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>🤝</p>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-3)' }}>
                Still have questions?
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)', maxWidth: 500, margin: '0 auto var(--space-6)' }}>
                If none of the above answers your question, we want to hear from you. We read and personally respond to every single email.
              </p>
              <a href="mailto:support@vexsen.store" className="btn btn-primary btn-lg">
                Send Us a Message
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
