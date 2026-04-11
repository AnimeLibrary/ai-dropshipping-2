'use client'

import Link from 'next/link'

interface BundleShowcaseProps {
  bundle: {
    id: string
    title: string
    hook: string
    price: number
    compareAtPrice: number
    products: Array<{
      id: string
      title: string
      heroImage: string
    }>
  }
}

export default function BundleShowcase({ bundle }: BundleShowcaseProps) {
  const savings = bundle.compareAtPrice - bundle.price
  const savingsPercent = Math.round((savings / bundle.compareAtPrice) * 100)

  return (
    <div className="bundle-pitch-card">
      <div className="bundle-badge">Triple Threat Bundle</div>
      <div className="bundle-header">
        <h3 className="bundle-title">{bundle.title}</h3>
        <p className="bundle-hook">{bundle.hook}</p>
      </div>

      <div className="bundle-visual-grid">
        {bundle.products.map((p, i) => (
          <div key={p.id} className="bundle-item">
            <div className="bundle-item-image">
               {/* Simplified placeholder logic for image */}
               <span style={{ fontSize: 24 }}>📦</span>
            </div>
            <p className="bundle-item-name">{p.title}</p>
            {i < bundle.products.length - 1 && <span className="bundle-plus">+</span>}
          </div>
        ))}
      </div>

      <div className="bundle-footer">
        <div className="bundle-pricing">
          <div className="bundle-current-price">${bundle.price.toFixed(2)}</div>
          <div className="bundle-old-price">${bundle.compareAtPrice.toFixed(2)}</div>
          <div className="bundle-savings-tag">Save {savingsPercent}%</div>
        </div>
        
        <Link 
          href={`/bundles/${bundle.id}`} 
          className="btn btn-accent btn-lg" 
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Activate Bundle Discount →
        </Link>
      </div>

      <style jsx>{`
        .bundle-pitch-card {
           background: var(--color-bg-secondary);
           border: 2px solid var(--color-accent);
           border-radius: var(--radius-xl);
           padding: var(--space-8);
           margin: var(--space-10) 0;
           position: relative;
           overflow: hidden;
        }
        .bundle-badge {
           position: absolute;
           top: 0;
           right: 0;
           background: var(--color-accent);
           color: white;
           padding: var(--space-1) var(--space-4);
           font-size: var(--text-xs);
           font-weight: 700;
           text-transform: uppercase;
           border-bottom-left-radius: var(--radius-md);
        }
        .bundle-header {
           margin-bottom: var(--space-8);
        }
        .bundle-title {
           font-family: var(--font-heading);
           font-size: var(--text-xl);
           font-weight: 800;
           margin-bottom: var(--space-1);
        }
        .bundle-hook {
           color: var(--color-text-secondary);
           font-size: var(--text-sm);
        }
        .bundle-visual-grid {
           display: flex;
           align-items: center;
           justify-content: space-around;
           gap: var(--space-4);
           margin-bottom: var(--space-8);
           padding: var(--space-4) 0;
        }
        .bundle-item {
           flex: 1;
           text-align: center;
           position: relative;
        }
        .bundle-item-image {
           width: 60px;
           height: 60px;
           background: var(--color-bg);
           border-radius: var(--radius-full);
           display: flex;
           align-items: center;
           justify-content: center;
           margin: 0 auto var(--space-2);
           border: 1px solid var(--color-border-soft);
        }
        .bundle-item-name {
           font-size: 10px;
           font-weight: 600;
           color: var(--color-text-muted);
           display: -webkit-box;
           -webkit-line-clamp: 2;
           -webkit-box-orient: vertical;
           overflow: hidden;
        }
        .bundle-plus {
           position: absolute;
           right: -20px;
           top: 20px;
           font-size: 20px;
           color: var(--color-accent);
           font-weight: 800;
        }
        .bundle-pricing {
           display: flex;
           align-items: baseline;
           gap: var(--space-3);
           margin-bottom: var(--space-4);
        }
        .bundle-current-price {
           font-size: var(--text-2xl);
           font-weight: 800;
           color: var(--color-text-primary);
        }
        .bundle-old-price {
           font-size: var(--text-sm);
           text-decoration: line-through;
           color: var(--color-text-muted);
        }
        .bundle-savings-tag {
           background: #e6fffa;
           color: #234e52;
           padding: 2px 8px;
           border-radius: var(--radius-sm);
           font-size: 10px;
           font-weight: 700;
        }
      `}</style>
    </div>
  )
}
