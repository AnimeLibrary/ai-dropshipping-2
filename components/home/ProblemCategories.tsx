import Link from 'next/link'

// Niches that actually have approved products — update this list as you add products.
// This drives which categories show "Coming Soon" vs a live CTA.
const ACTIVE_NICHES = new Set(['general', 'coin-purse', 'accessories'])

const PROBLEM_CATEGORIES = [
  {
    id: 'back-pain',
    emoji: '🪑',
    title: 'Back & Posture Pain',
    painLine: "You've adjusted your chair 50 times. It still hurts.",
    hookLine: "Here's the fix that actually works.",
    href: '/collections?niche=back-pain',
    niche: 'back-pain',
    trending: true,
  },
  {
    id: 'sleep',
    emoji: '😴',
    title: 'Sleep Problems',
    painLine: "It's 2am. You're exhausted but your brain won't stop.",
    hookLine: "What your nervous system actually needs.",
    href: '/collections?niche=sleep',
    niche: 'sleep',
    trending: true,
  },
  {
    id: 'home-office',
    emoji: '🖥️',
    title: 'Work From Home Setup',
    painLine: 'Daily headaches, neck strain, eye fatigue — it compounds.',
    hookLine: "The remote work problem stack, solved.",
    href: '/collections?niche=home-office',
    niche: 'home-office',
    trending: false,
  },
  {
    id: 'pet-care',
    emoji: '🐾',
    title: 'Pet Owner Problems',
    painLine: 'Hair everywhere. Guests coming over. Lint rolls half gone.',
    hookLine: "One product stops the cycle.",
    href: '/collections?niche=pet-care',
    niche: 'pet-care',
    trending: false,
  },
  {
    id: 'fitness',
    emoji: '💪',
    title: 'Fitness & Recovery',
    painLine: "Putting in the work but your body won't recover fast enough.",
    hookLine: "Tools serious about results, not aesthetics.",
    href: '/collections?niche=fitness',
    niche: 'fitness',
    trending: true,
  },
  {
    id: 'kitchen',
    emoji: '🍳',
    title: 'Kitchen Frustrations',
    painLine: 'Prep takes too long. Cleanup takes longer. Every night.',
    hookLine: "Smart products that make cooking effortless.",
    href: '/collections?niche=kitchen',
    niche: 'kitchen',
    trending: false,
  },
]

export default function ProblemCategories() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
        <h2 className="heading-xl" style={{ marginBottom: 'var(--space-4)' }}>
          Shop By <span className="gradient-text">Problem</span>
        </h2>
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', maxWidth: 560, margin: '0 auto' }}>
          We don't organize by product type. We organize by the problem you're actually dealing with.
        </p>
      </div>

      <div className="grid-3" role="list" aria-label="Problem categories">
        {PROBLEM_CATEGORIES.map((cat, i) => {
          const isActive = ACTIVE_NICHES.has(cat.niche)
          return isActive ? (
            <Link
              key={cat.id}
              href={cat.href}
              id={`problem-cat-${cat.id}`}
              className="card reveal"
              style={{ animationDelay: `${i * 80}ms`, display: 'block' }}
              role="listitem"
            >
              <div className="card-body">
                <div className="flex-between" style={{ marginBottom: 'var(--space-4)' }}>
                  <span style={{ fontSize: '2.5rem' }}>{cat.emoji}</span>
                  {cat.trending && (
                    <span className="badge badge-accent">📈 Trending</span>
                  )}
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-text-primary)' }}>
                  {cat.title}
                </h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-1)' }}>
                  {cat.painLine}
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-accent)', fontWeight: 600, lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
                  {cat.hookLine}
                </p>
                <div className="flex-between">
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', fontWeight: 700 }}>
                    Shop the fix →
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            // Coming Soon — no live CTA, no dead-end click
            <div
              key={cat.id}
              id={`problem-cat-${cat.id}`}
              className="card reveal"
              style={{ animationDelay: `${i * 80}ms`, opacity: 0.65, cursor: 'default' }}
              role="listitem"
            >
              <div className="card-body">
                <div className="flex-between" style={{ marginBottom: 'var(--space-4)' }}>
                  <span style={{ fontSize: '2.5rem' }}>{cat.emoji}</span>
                  <span className="badge badge-neutral">Coming Soon</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-text-primary)' }}>
                  {cat.title}
                </h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-1)' }}>
                  {cat.painLine}
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
                  We're validating products for this category now.
                </p>
                <div className="flex-between">
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Drop in soon →
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
