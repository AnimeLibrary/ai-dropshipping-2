const PROBLEMS = [
  {
    niche: 'Back & Posture',
    emoji: '🪑',
    problem: 'You adjust your chair a hundred times a day. You take ibuprofen. You stretch. Nothing sticks — the tension is back within an hour.',
    solution: 'We sourced a posture corrector that retrains your spine over 2–3 weeks by providing active resistance at the exact muscles that collapse under desk weight.',
    href: '/problems/back-pain',
  },
  {
    niche: 'Sleep Quality',
    emoji: '😴',
    problem: 'You get 8 hours in bed but wake up foggy. You lie there scrolling instead of sleeping. The alarm hits and you\'re no less tired than yesterday.',
    solution: 'Blue light blocking, sleep-priming tools that shift your body into rest mode before your head hits the pillow — not after.',
    href: '/problems/sleep',
  },
  {
    niche: 'Pet Owners',
    emoji: '🐾',
    problem: 'Pet hair is on every surface. The lint roller runs out. The vacuum misses it. Guests arrive and immediately notice.',
    solution: 'A silicone grooming glove that lifts embedded fur from fabric in one pass — no adhesive strips, no disposal, no judgment.',
    href: '/problems/pet-care',
  },
]

export default function ProblemSolution() {
  return (
    <section
      style={{
        padding: 'var(--space-20) 0',
        background: 'var(--color-bg)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
      }}
      id="problem-solution"
    >
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto', marginBottom: 'var(--space-14)' }}>
          <span style={{
            display: 'inline-block', fontSize: '0.75rem', fontWeight: 700,
            color: 'var(--color-accent)', textTransform: 'uppercase',
            letterSpacing: '0.1em', marginBottom: 'var(--space-4)'
          }}>
            Real Problems. Real Fixes.
          </span>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800, lineHeight: 1.1,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.025em',
            marginBottom: 'var(--space-4)'
          }}>
            Built to fix the frustrations<br />
            <span style={{ color: 'var(--color-accent)' }}>everyone complains about.</span>
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-lg)', lineHeight: 1.6 }}>
            We went looking for the products that actually solve these. Not the ones with the best ads.
          </p>
        </div>

        {/* Problem → Solution Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {PROBLEMS.map((item, i) => (
            <div
              key={item.niche}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 0,
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
              }}
            >
              {/* LEFT: The Problem */}
              <div style={{
                background: 'var(--color-bg-secondary)',
                padding: 'var(--space-8)',
                borderRight: '1px solid var(--color-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  <span style={{ fontSize: '1.75rem' }}>{item.emoji}</span>
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>The Problem</p>
                    <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>{item.niche}</p>
                  </div>
                </div>
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 1.8, fontStyle: 'italic' }}>
                  &ldquo;{item.problem}&rdquo;
                </p>
              </div>

              {/* RIGHT: The Vexsen Fix */}
              <div style={{
                background: 'var(--color-bg)',
                padding: 'var(--space-8)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
              }}>
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>✓ The Vexsen Fix</p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                    {item.solution}
                  </p>
                </div>
                <a
                  href={item.href}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 'var(--text-sm)', fontWeight: 700,
                    color: 'var(--color-accent)',
                    marginTop: 'auto'
                  }}
                >
                  See the fix → 
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
