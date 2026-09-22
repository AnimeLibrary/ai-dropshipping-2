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

export default function TrendingProducts({ products }: Props) {
  const isEmpty = products.length === 0

  return (
    <div id="trending-products">
      <div
        className="flex-between"
        style={{ marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'flex-end' }}
      >
        <div>
          <span className="badge badge-glow" style={{ marginBottom: 'var(--space-3)' }}>
            Viral Beauty Upgrades
          </span>
          <h2 className="heading-xl">
            Trending Lip Care <span className="gradient-text">&amp; Longwear Tints</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 6 }}>
            24-hour waterproof stains, plumping juicy oils, and transfer-proof tints designed for effortless everyday wear.
          </p>
        </div>
        <Link href="/collections" className="btn btn-secondary hide-mobile" id="trending-view-all">
          Browse All &rarr;
        </Link>
      </div>

      {isEmpty ? (
        <div className="store-empty-state">
          <strong>Verified products are syncing.</strong>
          <p>
            Nothing fake is shown here. Once a product clears approval, it appears on this page with its real checkout path.
          </p>
        </div>
      ) : (
        <div className="home-product-grid" role="list" aria-label="Trending products">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product as any} index={i} />
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }} className="hide-desktop">
        <Link href="/collections" className="btn btn-secondary" id="trending-view-all-mobile">
          View All Products &rarr;
        </Link>
      </div>
    </div>
  )
}
