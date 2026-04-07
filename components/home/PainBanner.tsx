// PainBanner — the trust bridge between the hero and the products.
// Answers the silent question every skeptical visitor is asking:
// "How do I know these things are actually worth buying?"

export default function PainBanner() {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, var(--color-bg-secondary) 0%, rgba(124,58,237,0.06) 100%)',
        border: '1px solid var(--color-border)',
        borderLeft: '4px solid var(--color-accent)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-8) var(--space-10)',
        margin: '0 auto',
        maxWidth: 'var(--max-width)',
      }}
      role="note"
      aria-label="How we filter products"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-8)',
          flexWrap: 'wrap',
        }}
      >
        {/* Left — the statement */}
        <div style={{ flex: '1 1 300px' }}>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 'var(--space-3)',
            }}
          >
            The Filter
          </p>
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              lineHeight: 1.4,
              marginBottom: 'var(--space-2)',
            }}
          >
            Most products promise results.
            <br />
            Every product below was chosen because real buyers proved it delivers.
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            91% of what we analyze never makes it here. Here's the data behind every pick.
          </p>
        </div>

        {/* Right — 3 filter steps */}
        <div
          style={{
            flex: '1 1 280px',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          {[
            { step: '01', label: 'Real ad performance data', detail: 'Kalodata + Minea trend scoring' },
            { step: '02', label: 'Human approval required', detail: 'A person reviewed every product' },
            { step: '03', label: 'Supplier verified', detail: 'Quality + shipping confirmed before listing' },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-3)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 800,
                  color: 'var(--color-accent)',
                  flexShrink: 0,
                  letterSpacing: '0.05em',
                  paddingTop: 2,
                }}
              >
                {item.step}
              </span>
              <div>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {item.label}
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
