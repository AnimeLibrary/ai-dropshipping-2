import Link from 'next/link'

const ACTIVE_NICHES = new Set(['accessories', 'coin-purse', 'general'])

const PROBLEM_CATEGORIES = [
  {
    id: 'accessories',
    mark: 'EC',
    title: 'Everyday Carry',
    painLine: 'Wallets, cards, cash, and keys should not turn into pocket chaos.',
    hookLine: 'Compact pieces that make daily carry feel organized and intentional.',
    href: '/collections?niche=accessories',
    niche: 'accessories',
    status: 'Live now',
  },
  {
    id: 'travel-organization',
    mark: 'TR',
    title: 'Travel Organization',
    painLine: 'Small essentials disappear exactly when you need them.',
    hookLine: 'Packs, pouches, and holders built for faster grab-and-go days.',
    href: '/collections?niche=travel',
    niche: 'travel',
    status: 'In validation',
  },
  {
    id: 'giftable-finds',
    mark: 'GF',
    title: 'Giftable Finds',
    painLine: 'Most impulse gifts look good online and feel cheap in person.',
    hookLine: 'Useful, clean, low-risk gifts people can actually keep using.',
    href: '/collections?niche=gifts',
    niche: 'gifts',
    status: 'In validation',
  },
  {
    id: 'home-efficiency',
    mark: 'HE',
    title: 'Home Efficiency',
    painLine: 'Tiny daily annoyances waste more time than they should.',
    hookLine: 'Simple tools that remove friction from the routines you repeat most.',
    href: '/collections?niche=home',
    niche: 'home',
    status: 'In validation',
  },
]

export default function ProblemCategories() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
        <span className="badge badge-neutral" style={{ marginBottom: 'var(--space-3)' }}>
          Shop by use case
        </span>
        <h2 className="heading-xl" style={{ marginBottom: 'var(--space-4)' }}>
          Find the <span className="gradient-text">Right Upgrade</span>
        </h2>
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', maxWidth: 640, margin: '0 auto' }}>
          A cleaner category system makes the store feel intentional instead of random. Live categories only link when products are actually approved.
        </p>
      </div>

      <div className="grid-4 problem-card-grid" role="list" aria-label="Use-case categories">
        {PROBLEM_CATEGORIES.map((cat, i) => {
          const isActive = ACTIVE_NICHES.has(cat.niche)
          const content = (
            <div className="card-body">
              <div className="flex-between" style={{ marginBottom: 'var(--space-4)', gap: 'var(--space-3)' }}>
                <span className="problem-mark" aria-hidden="true">{cat.mark}</span>
                <span className={`badge ${isActive ? 'badge-accent' : 'badge-neutral'}`}>{cat.status}</span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-text-primary)' }}>
                {cat.title}
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-1)' }}>
                {cat.painLine}
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)', fontWeight: 600, lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
                {isActive ? cat.hookLine : 'Products are being reviewed before this section goes live.'}
              </p>
              <span style={{ fontSize: 'var(--text-xs)', color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)', fontWeight: 700 }}>
                {isActive ? 'Shop live picks' : 'Validation in progress'} &rarr;
              </span>
            </div>
          )

          return isActive ? (
            <Link
              key={cat.id}
              href={cat.href}
              id={`problem-cat-${cat.id}`}
              className="card reveal problem-card"
              style={{ animationDelay: `${i * 80}ms`, display: 'block' }}
              role="listitem"
            >
              {content}
            </Link>
          ) : (
            <div
              key={cat.id}
              id={`problem-cat-${cat.id}`}
              className="card reveal problem-card problem-card-muted"
              style={{ animationDelay: `${i * 80}ms` }}
              role="listitem"
            >
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
