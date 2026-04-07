const TESTIMONIALS = [
  {
    id: 1,
    name: 'Marcus D.',
    location: 'Austin, TX',
    initials: 'MD',
    color: '#7c3aed',
    stars: 5,
    before: 'Aching lower back every single day for 14 months. Tried standing desk, new chair, stretching.',
    after: 'Back pain gone in 4 days of using the lumbar cushion. I actually forgot about it.',
    daysToResult: 4,
    text: 'I was skeptical about another "trending product" site. But the guide explained WHY my back hurt — not just "buy this pillow." Got the lumbar cushion, back pain gone in 4 days.',
    product: 'LumbarPro Support Cushion',
  },
  {
    id: 2,
    name: 'Aisha T.',
    location: 'London, UK',
    initials: 'AT',
    color: '#0891b2',
    stars: 5,
    before: 'Waking up exhausted every morning for 3 years. Racing thoughts the moment I lay down.',
    after: 'Sleeping through the night within a week. First time in years.',
    daysToResult: 6,
    text: 'The sleep guide was the most useful thing I\'d read about anxiety sleep problems. Felt seen. The weighted blanket recommendation actually worked — I sleep through the night now.',
    product: 'WeightedCalm Blanket',
  },
  {
    id: 3,
    name: 'James K.',
    location: 'Sydney, AU',
    initials: 'JK',
    color: '#059669',
    stars: 5,
    before: 'Dog hair completely covering the couch. $40 spent on solutions that didn\'t last 2 weeks.',
    after: 'Entire couch clean in 2 swipes. No tape. No refills.',
    daysToResult: 1,
    text: 'Dog hair was ruining my couch. Spent $40 on a "solution" that didn\'t work. FurRoll cleared the entire couch in 2 swipes. Wish I\'d found this 2 years ago.',
    product: 'FurRoll Pet Hair Remover',
  },
  {
    id: 4,
    name: 'Priya S.',
    location: 'Toronto, CA',
    initials: 'PS',
    color: '#dc2626',
    stars: 5,
    before: 'Daily headaches from WFH setup. Neck pain that moved into my shoulders by 3pm.',
    after: 'No headaches since week 1. Neck pain gone by day 5.',
    daysToResult: 5,
    text: 'WFH setup was giving me headaches daily. The neck pain guide linked me to exactly what I needed. No upsell BS — just the right product with data to back it up.',
    product: 'Ergonomic Monitor Stand',
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
          Before & After — From People Who Found the Fix
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-3)', maxWidth: 480, margin: 'var(--space-3) auto 0' }}>
          Not reviews. Outcomes. Real people, real before states, real timelines.
        </p>
      </div>

      <div
        className="testimonial-strip"
        role="list"
        aria-label="Customer testimonials"
      >
        {TESTIMONIALS.map((t) => (
          <div key={t.id} className="testimonial-card" role="listitem">
            {/* Before / After */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  borderLeft: '3px solid rgba(239,68,68,0.5)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-3)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#ef4444', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Before
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {t.before}
                </p>
              </div>
              <div
                style={{
                  background: 'rgba(34,197,94,0.08)',
                  borderLeft: '3px solid rgba(34,197,94,0.6)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-3)',
                }}
              >
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#22c55e', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  After
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {t.after}
                </p>
              </div>
            </div>

            {/* Star rating */}
            <div className="stars" aria-label={`${t.stars} out of 5 stars`} style={{ marginBottom: 'var(--space-3)' }}>
              {Array.from({ length: t.stars }).map((_, i) => (
                <span key={i} className="star" aria-hidden="true">★</span>
              ))}
            </div>

            {/* Quote */}
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                marginBottom: 'var(--space-4)',
                fontStyle: 'italic',
              }}
            >
              "{t.text}"
            </p>

            {/* Author + result timeline */}
            <div className="flex-between" style={{ alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                {/* Avatar initial */}
                <div
                  aria-hidden="true"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: t.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 800,
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  {t.initials}
                </div>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {t.name}
                  </p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {t.location}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Results within
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-success)', fontWeight: 800 }}>
                  {t.daysToResult} {t.daysToResult === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-3)', fontWeight: 600 }}>
              Via: {t.product}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
