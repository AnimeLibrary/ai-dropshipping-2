import Link from 'next/link'

export default function ReferralBanner() {
  return (
    <section
      style={{
        background: 'linear-gradient(135deg, var(--color-accent) 0%, #a85a1a 100%)',
        padding: 'var(--space-12) 0',
        position: 'relative',
        overflow: 'hidden',
      }}
      id="referral-cta"
    >
      {/* Background pattern */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, opacity: 0.08,
        backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="container" style={{ position: 'relative' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-8)',
          alignItems: 'center',
        }}>
          {/* Left: Copy */}
          <div>
            <span style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: '0.7rem', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              padding: '4px 12px', borderRadius: 'var(--radius-full)',
              marginBottom: 'var(--space-4)',
            }}>
              🎁 Referral Program
            </span>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 800, color: '#fff',
              letterSpacing: '-0.025em',
              marginBottom: 'var(--space-3)', lineHeight: 1.1,
            }}>
              Give 15% off.<br />Earn store credits.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'var(--text-lg)', lineHeight: 1.65 }}>
              Share your unique promo code with a friend. They save 15% on their first order. You earn credits automatically — no forms, no waiting.
            </p>
          </div>

          {/* Right: 3 steps + CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[
              { step: '1', text: 'Get your code — free, takes 10 seconds after signing in.' },
              { step: '2', text: 'Share it with anyone — text, DM, social, email.' },
              { step: '3', text: 'They save 15%. You earn credits. Instantly.' },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <span style={{
                  background: 'rgba(255,255,255,0.2)', color: '#fff',
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
                  border: '1px solid rgba(255,255,255,0.3)',
                }}>{item.step}</span>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>{item.text}</p>
              </div>
            ))}

            <Link
              href="/referral"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, marginTop: 'var(--space-2)',
                background: '#fff', color: 'var(--color-accent)',
                padding: '14px 28px', borderRadius: 'var(--radius-md)',
                fontWeight: 800, fontSize: 'var(--text-base)',
                textDecoration: 'none', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}
            >
              Get My Referral Code →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
