import Link from 'next/link'

export default function BrandStory() {
  return (
    <section
      id="brand-story"
      style={{
        background: 'var(--color-bg-secondary)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-12) 0',
      }}
    >
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-8)',
          alignItems: 'center',
        }}>
          {/* Left: hook + link */}
          <div>
            <span style={{
              display: 'inline-block',
              fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-4)'
            }}>
              The Vexsen Standard
            </span>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 800, lineHeight: 1.1,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.025em',
              marginBottom: 'var(--space-4)'
            }}>
              We test 100.<br />You buy the 1 that works.
            </h2>
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-6)' }}>
              The internet is flooded with junk. We&apos;re the filter. Every product listed here has passed our internal curation process — or it doesn&apos;t ship.
            </p>
            <Link href="/about" className="btn btn-secondary">
              Why we built this →
            </Link>
          </div>

          {/* Right: 3 pillars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[
              { icon: '🎯', title: 'Outcome-Driven', desc: 'Every product must permanently solve a specific problem, or we refuse to sell it.' },
              { icon: '🔍', title: 'Strict Auditing', desc: 'Supply chains are vetted for material durability. Cheap builds get cut.' },
              { icon: '🤝', title: 'We Back It', desc: 'Defective? Full refund. Not for you? Store credit. You never lose.' },
            ].map((item) => (
              <div key={item.icon} style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.25rem', marginTop: '2px', flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{item.title}</p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
