const TESTIMONIALS = [
  {
    id: 1,
    name: 'Marcus D.',
    location: 'Austin, TX',
    stars: 5,
    text: 'I was skeptical about another "trending product" site. But the guides actually explained WHY my back hurt, not just "buy this pillow." Got the lumbar cushion, back pain gone in 4 days.',
    product: 'LumbarPro Support Cushion',
  },
  {
    id: 2,
    name: 'Aisha T.',
    location: 'London, UK',
    stars: 5,
    text: 'The sleep guide was the most useful thing I\'d read about anxiety sleep problems. Felt seen. The weighted blanket recommendation actually worked — I sleep through the night now.',
    product: 'WeightedCalm Blanket',
  },
  {
    id: 3,
    name: 'James K.',
    location: 'Sydney, AU',
    stars: 5,
    text: 'Dog hair was ruining my couch. Spent $40 on a "solution" that didn\'t work. FurRoll cleared the entire couch in 2 swipes. Wish I\'d found this 2 years ago.',
    product: 'FurRoll Pet Hair Remover',
  },
  {
    id: 4,
    name: 'Priya S.',
    location: 'Toronto, CA',
    stars: 5,
    text: 'WFH setup was giving me headaches daily. The neck pain guide linked me to exactly what I needed. No upsell BS — just the right product with data to back it up.',
    product: 'Ergonomic Monitor Stand',
  },
]

export default function SocialProof() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <span className="badge badge-neutral" style={{ marginBottom: 'var(--space-3)' }}>
          ★ Real Results
        </span>
        <h2 className="heading-lg">
          People Who Found the Right Solution
        </h2>
      </div>

      <div
        className="testimonial-strip"
        role="list"
        aria-label="Customer testimonials"
      >
        {TESTIMONIALS.map((t) => (
          <div key={t.id} className="testimonial-card" role="listitem">
            <div className="stars" aria-label={`${t.stars} out of 5 stars`}>
              {Array.from({ length: t.stars }).map((_, i) => (
                <span key={i} className="star" aria-hidden="true">★</span>
              ))}
            </div>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                marginBottom: 'var(--space-4)',
              }}
            >
              "{t.text}"
            </p>
            <div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                }}
              >
                {t.name}
              </p>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {t.location} · {t.product}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
