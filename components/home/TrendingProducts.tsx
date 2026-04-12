import Link from 'next/link'
import ProductCard from '@/components/commerce/ProductCard'

interface SimpleProduct {
  id: string
  slug: string
  title: string
  niche: string
  category?: string | null
  price: number
  compareAtPrice?: number | null
  heroImage: string
  shortDescription?: string | null
  trendScore?: number | null
  validationStatus?: string
}

interface Props {
  products: SimpleProduct[]
}

// Placeholder products shown when DB is empty — disappear once real products exist
const PLACEHOLDER_PRODUCTS: SimpleProduct[] = [
  { id: 'p1', slug: '#', title: 'Posture Corrector Pro', niche: 'back-pain', price: 39.99, compareAtPrice: 64.99, heroImage: '/placeholder.png', shortDescription: 'Eliminate upper back tension within 7 days of use.', trendScore: 95 },
  { id: 'p2', slug: '#', title: 'Deep Sleep Bundle', niche: 'sleep', price: 49.99, compareAtPrice: 79.99, heroImage: '/placeholder.png', shortDescription: 'Fall asleep faster and wake up without grogginess.', trendScore: 88 },
  { id: 'p3', slug: '#', title: 'Pet Hair Eraser Glove', niche: 'pets', price: 24.99, compareAtPrice: 39.99, heroImage: '/placeholder.png', shortDescription: 'Remove embedded pet hair from fabric in seconds.', trendScore: 82 },
  { id: 'p4', slug: '#', title: 'Lumbar Relief Cushion', niche: 'back-pain', price: 34.99, compareAtPrice: 54.99, heroImage: '/placeholder.png', shortDescription: 'Desk chair insert that neutralises lower back pain all day.', trendScore: 78 },
  { id: 'p5', slug: '#', title: 'Blue Light Sleep Glasses', niche: 'sleep', price: 29.99, compareAtPrice: 49.99, heroImage: '/placeholder.png', shortDescription: 'Block screen glare and prime your brain for sleep by 9pm.', trendScore: 74 },
  { id: 'p6', slug: '#', title: 'Odour Eliminator Spray', niche: 'home', price: 19.99, compareAtPrice: 32.99, heroImage: '/placeholder.png', shortDescription: 'Industrial-grade odour removal that actually works.', trendScore: 71 },
]

export default function TrendingProducts({ products }: Props) {
  const displayProducts = products.length > 0 ? products : PLACEHOLDER_PRODUCTS
  const isEmpty = products.length === 0

  return (
    <div id="trending-products">
      {/* Section header */}
      <div
        className="flex-between"
        style={{ marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'flex-end' }}
      >
        <div>
          <span className="badge badge-glow" style={{ marginBottom: 'var(--space-3)' }}>
            📈 Trending Now
          </span>
          <h2 className="heading-xl">
            Products People Are{' '}
            <span className="gradient-text">Actually Buying</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 6 }}>
            Every item is verified before it ships. Updated weekly.
          </p>
        </div>
        <Link href="/collections" className="btn btn-secondary hide-mobile" id="trending-view-all">
          Browse All →
        </Link>
      </div>

      {isEmpty && (
        <div style={{
          background: 'var(--color-bg-secondary)',
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            🤖 AI is sourcing products — these are example listings. Import products via the admin panel.
          </p>
        </div>
      )}

      {/* Product Grid — dense, like Temu/Amazon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
        gap: 'var(--space-4)',
      }} role="list" aria-label="Trending products">
        {displayProducts.map((product, i) => (
          <ProductCard key={product.id} product={product as any} index={i} />
        ))}
      </div>

      {/* Mobile view all */}
      <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }} className="hide-desktop">
        <Link href="/collections" className="btn btn-secondary" id="trending-view-all-mobile">
          View All Products →
        </Link>
      </div>
    </div>
  )
}
