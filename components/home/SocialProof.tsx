import Link from 'next/link'

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Marcus D.',
    location: 'Austin, TX',
    initials: 'MD',
    color: '#7c3aed',
    stars: 5,
    before: 'Lower back aching every single day. Tried a standing desk, new chair, stretching routines.',
    after: 'Tension gone within the first week. Genuinely forgot what it felt like to hurt.',
    daysToResult: 4,
    text: "I was skeptical. But the guide explained WHY my back hurt — not just \"buy this thing.\" Found the fix, ordered it. Back pain gone in 4 days. I actually forgot about it.",
    ctaText: 'Get the fix Marcus used →',
    ctaHref: '/collections?niche=back-pain',
  },
  {
    id: 2,
    name: 'Aisha T.',
    location: 'London, UK',
    initials: 'AT',
    color: '#0891b2',
    stars: 5,
    before: 'Exhausted every morning for 3 years. Racing thoughts the moment I lay down.',
    after: 'Sleeping through the night within a week. First time in years.',
    daysToResult: 6,
    text: "The sleep guide was the most useful thing I'd read on this topic. Felt like they actually understood the problem. The recommended solution worked exactly as described.",
    ctaText: 'Find what helped Aisha →',
    ctaHref: '/collections?niche=sleep',
  },
  {
    id: 3,
    name: 'James K.',
    location: 'Sydney, AU',
    initials: 'JK',
    color: '#059669',
    stars: 5,
    before: 'Pet hair on every surface. $40 spent on solutions that lasted two weeks.',
    after: 'Entire couch cleaned in under a minute. No tape. No refills.',
    daysToResult: 1,
    text: "Spent $40 on a 'solution' that did nothing. What Vexsen recommended cleared the problem in one go. Wish I'd found this 2 years ago.",
    ctaText: 'See the pet fix →',
    ctaHref: '/collections?niche=pet-care',
  },
  {
    id: 4,
    name: 'Priya S.',
    location: 'Toronto, CA',
    initials: 'PS',
    color: '#dc2626',
    stars: 5,
    before: 'Daily headaches from the WFH setup. Neck pain that moved to my shoulders by 3pm.',
    after: 'No headaches since week 1. Neck pain completely resolved by day 5.',
    daysToResult: 5,
    text: "The guide linked me to exactly what I needed. No upsell, no fluff — the right product with data to back it. My setup is fixed and I'm not in pain anymore.",
    ctaText: 'Fix your WFH setup →',
    ctaHref: '/collections?niche=home-office',
  },
]

export default function SocialProof() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
        <span className="badge badge-neutral" style={{ marginBottom: 'var(--space-3)' }}>
          ★ Real Results
        </span>
        <h2 className="heading-lg">
          Before &amp; After: From People Who Found the Fix
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-3)', maxWidth: 480, margin: 'var(--space-3) auto 0' }}>
          Not reviews. Outcomes. Real people, real before states, real timelines.
        </p>
      </div>

      <div className="testimonial-strip" role="list" aria-label="Customer testimonials">
        {TESTIMONIALS.map((t) => (
          <div key={t.id} className="testimonial-card" role="listitem">

            {/* Before / After blocks */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ background: 'rgba(239,68,68,0.08)', borderLeft: '3px solid rgba(239,68,68,0.5)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#ef4444', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Before</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{t.before}</p>
              </div>
              <div style={{ background: 'rgba(34,197,94,0.08)', borderLeft: '3px solid rgba(34,197,94,0.6)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)' }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#22c55e', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>After</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{t.after}</p>
              </div>
            </div>

            {/* Stars */}
            <div className="stars" aria-label={`${t.stars} out of 5 stars`} style={{ marginBottom: 'var(--space-3)' }}>
              {Array.from({ length: t.stars }).map((_, i) => (
                <span key={i} className="star" aria-hidden="true">★</span>
              ))}
            </div>

            {/* Quote */}
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-4)', fontStyle: 'italic' }}>
              &ldquo;{t.text}&rdquo;
            </p>

            {/* Author + timeline */}
            <div className="flex-between" style={{ alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div aria-hidden="true" style={{ width: 36, height: 36, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                  {t.initials}
                </div>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{t.name}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{t.location}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Results within</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-success)', fontWeight: 800 }}>{t.daysToResult} {t.daysToResult === 1 ? 'day' : 'days'}</p>
              </div>
            </div>

            {/* ── Per-testimonial CTA — highest-leverage conversion addition ── */}
            <Link
              href={t.ctaHref}
              style={{
                display: 'block',
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                color: 'var(--color-accent)',
                textAlign: 'center',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {t.ctaText}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
