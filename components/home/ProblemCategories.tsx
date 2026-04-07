import Link from 'next/link'

const PROBLEM_CATEGORIES = [
  {
    id: 'back-pain',
    emoji: '🪑',
    title: 'Back & Posture Pain',
    description: 'Sitting all day destroying your spine? These products fix the root cause.',
    href: '/problems/back-pain',
    count: 14,
    trending: true,
  },
  {
    id: 'sleep',
    emoji: '😴',
    title: 'Sleep Problems',
    description: 'Anxiety, insomnia, restless nights — solutions that work with your biology.',
    href: '/problems/sleep',
    count: 11,
    trending: true,
  },
  {
    id: 'home-office',
    emoji: '🖥️',
    title: 'Work From Home Setup',
    description: 'Neck pain, eye strain, poor posture — the remote work problem stack.',
    href: '/problems/home-office',
    count: 9,
    trending: false,
  },
  {
    id: 'pet-care',
    emoji: '🐾',
    title: 'Pet Owner Problems',
    description: 'Hair everywhere, destructive boredom, accidents — real solutions for pet chaos.',
    href: '/problems/pet-care',
    count: 8,
    trending: false,
  },
  {
    id: 'fitness',
    emoji: '💪',
    title: 'Fitness & Recovery',
    description: 'Sore muscles, plateau, motivation drops — tools serious about results.',
    href: '/problems/fitness',
    count: 16,
    trending: true,
  },
  {
    id: 'kitchen',
    emoji: '🍳',
    title: 'Kitchen Frustrations',
    description: 'Mess, waste, slow prep — smart products that make cooking effortless.',
    href: '/problems/kitchen',
    count: 12,
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
          We don't organize by product type — we organize by the problem you're trying to solve.
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
                  marginBottom: 'var(--space-2)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {cat.title}
              </h3>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: 'var(--space-4)',
                }}
              >
                {cat.description}
              </p>
              <div className="flex-between">
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {cat.count} products →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
