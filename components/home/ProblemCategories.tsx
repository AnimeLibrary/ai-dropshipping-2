import Link from 'next/link'

const PROBLEM_CATEGORIES = [
  {
    id: 'back-pain',
    emoji: '🪑',
    title: 'Back & Posture Pain',
    painLine: "You've adjusted your chair 50 times. It still hurts.",
    hookLine: "Here's why — and what's actually fixing it.",
    href: '/problems/back-pain',
    trending: true,
  },
  {
    id: 'sleep',
    emoji: '😴',
    title: 'Sleep Problems',
    painLine: "It's 2am. You're exhausted but your brain won't stop.",
    hookLine: "This is what your nervous system actually needs.",
    href: '/problems/sleep',
    trending: true,
  },
  {
    id: 'home-office',
    emoji: '🖥️',
    title: 'Work From Home Setup',
    painLine: 'Daily headaches, neck strain, eye fatigue — it compounds.',
    hookLine: "The remote work problem stack, solved in one place.",
    href: '/problems/home-office',
    trending: false,
  },
  {
    id: 'pet-care',
    emoji: '🐾',
    title: 'Pet Owner Problems',
    painLine: 'Hair everywhere. Guests coming over. Lint rolls half gone.',
    hookLine: "One product stops the cycle. Here it is.",
    href: '/problems/pet-care',
    trending: false,
  },
  {
    id: 'fitness',
    emoji: '💪',
    title: 'Fitness & Recovery',
    painLine: "You're putting in the work but your body won't recover fast enough.",
    hookLine: "Tools serious about results — not aesthetics.",
    href: '/problems/fitness',
    trending: true,
  },
  {
    id: 'kitchen',
    emoji: '🍳',
    title: 'Kitchen Frustrations',
    painLine: 'Prep takes too long. Cleanup takes longer. Every night.',
    hookLine: "Smart products that make cooking effortless.",
    href: '/problems/kitchen',
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
        <p
          style={{
            fontSize: 'var(--text-lg)',
            color: 'var(--color-text-secondary)',
            maxWidth: 560,
            margin: '0 auto',
          }}
        >
          We don't organize by product type. We organize by the problem you're actually dealing with.
        </p>
      </div>

      <div className="grid-3" role="list" aria-label="Problem categories">
        {PROBLEM_CATEGORIES.map((cat, i) => (
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
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 700,
                  marginBottom: 'var(--space-3)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {cat.title}
              </h3>

              {/* 2-line pain acknowledgment */}
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: 'var(--space-1)',
                }}
              >
                {cat.painLine}
              </p>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-accent)',
                  fontWeight: 600,
                  lineHeight: 1.6,
                  marginBottom: 'var(--space-4)',
                }}
              >
                {cat.hookLine}
              </p>

              <div className="flex-between">
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    fontWeight: 600,
                  }}
                >
                  Explore guides →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
