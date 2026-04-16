'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from '@/components/commerce/ProductCard'

interface Product {
  id: string; slug: string; title: string; niche: string
  category?: string | null; price: number; compareAtPrice?: number | null
  heroImage: string; shortDescription?: string | null; trendScore?: number | null
  validationStatus?: string
}

const SORT_OPTIONS = [
  { value: 'trending', label: '🔥 Trending' },
  { value: 'price-low', label: 'Price: Low → High' },
  { value: 'price-high', label: 'Price: High → Low' },
  { value: 'newest', label: 'Newest' },
]

export default function CollectionsClient({ products }: { products: Product[] }) {
  const searchParams = useSearchParams()
  const initialNiche = searchParams.get('niche') || 'all'
  
  const [activeNiche, setActiveNiche] = useState(initialNiche)
  const [sort, setSort] = useState('trending')
  const [search, setSearch] = useState('')

  // If the URL changes (like when clicking the problem category), update the filter state
  useEffect(() => {
    const urlNiche = searchParams.get('niche')
    if (urlNiche && urlNiche !== activeNiche) {
      setActiveNiche(urlNiche)
    }
  }, [searchParams])


  // Build niche tabs from real product data
  const niches = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of products) {
      const key = p.niche || 'other'
      counts[key] = (counts[key] || 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([niche, count]) => ({ niche, count }))
  }, [products])

  const filtered = useMemo(() => {
    let list = [...products]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.shortDescription || '').toLowerCase().includes(q) ||
        p.niche.toLowerCase().includes(q)
      )
    }

    // Niche filter
    if (activeNiche !== 'all') {
      list = list.filter(p => p.niche === activeNiche)
    }

    // Sort
    if (sort === 'trending') list.sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0))
    else if (sort === 'price-low') list.sort((a, b) => a.price - b.price)
    else if (sort === 'price-high') list.sort((a, b) => b.price - a.price)

    return list
  }, [products, activeNiche, sort, search])

  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>

      {/* ── Page Header ── */}
      <div style={{
        background: 'linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-10) 0 0'
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                fontWeight: 800, color: 'var(--color-text-primary)',
                letterSpacing: '-0.025em', marginBottom: 4
              }}>
                Shop the Collection
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                {products.length} verified products · Updated daily
              </p>
            </div>

            {/* Search + Sort */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', pointerEvents: 'none' }}>🔍</span>
                <input
                  type="search"
                  placeholder="Search products..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg-card)', color: 'var(--color-text-primary)',
                    fontSize: 'var(--text-sm)', width: 200, outline: 'none',
                    fontFamily: 'var(--font-body)'
                  }}
                />
              </div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                style={{
                  padding: '10px 14px', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', background: 'var(--color-bg-card)',
                  color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer'
                }}
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Niche Filter Tabs ── */}
          <div style={{
            display: 'flex', gap: 'var(--space-2)', overflowX: 'auto',
            paddingBottom: 'var(--space-1)', scrollbarWidth: 'none',
          }}>
            <button
              onClick={() => setActiveNiche('all')}
              style={{
                padding: '8px 18px', borderRadius: 'var(--radius-full)',
                border: `1px solid ${activeNiche === 'all' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: activeNiche === 'all' ? 'var(--color-accent)' : 'var(--color-bg-card)',
                color: activeNiche === 'all' ? '#fff' : 'var(--color-text-secondary)',
                fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                fontFamily: 'var(--font-body)'
              }}
            >
              All ({products.length})
            </button>
            {niches.map(({ niche, count }) => (
              <button
                key={niche}
                onClick={() => setActiveNiche(niche)}
                style={{
                  padding: '8px 18px', borderRadius: 'var(--radius-full)',
                  border: `1px solid ${activeNiche === niche ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: activeNiche === niche ? 'var(--color-accent)' : 'var(--color-bg-card)',
                  color: activeNiche === niche ? '#fff' : 'var(--color-text-secondary)',
                  fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
                  whiteSpace: 'nowrap', transition: 'all 0.2s ease', textTransform: 'capitalize',
                  fontFamily: 'var(--font-body)'
                }}
              >
                {niche.replace(/-/g, ' ')} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Product Grid ── */}
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-20) 0' }}>
            <p style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🔍</p>
            <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)' }}>
              {search ? `No results for "${search}"` : 'No products in this category yet'}
            </p>
            <p style={{ color: 'var(--color-text-muted)' }}>
              {search ? 'Try a different search term.' : 'Our AI is sourcing new products daily — check back soon.'}
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)' }}>
              Showing {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              {activeNiche !== 'all' ? ` in ${activeNiche.replace(/-/g, ' ')}` : ''}
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 'var(--space-4)',
            }}>
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p as any} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
