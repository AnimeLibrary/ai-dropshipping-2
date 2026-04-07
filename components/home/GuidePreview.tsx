import Link from 'next/link'
import { KeywordCluster } from '@/lib/data/keywords'

interface Props {
  clusters: KeywordCluster[]
}

export default function GuidePreview({ clusters }: Props) {
  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <span className="badge badge-accent" style={{ marginBottom: 'var(--space-3)' }}>
            🚀 Rising Fast
          </span>
          <h2 className="heading-xl">
            Guides That Actually <span className="gradient-text">Solve Things</span>
          </h2>
        </div>
        <Link href="/guides" className="btn btn-secondary hide-mobile" id="guides-view-all">
          All Guides →
        </Link>
      </div>

      <div className="grid-2" role="list" aria-label="Featured guides">
        {clusters.map((cluster, i) => (
          <Link
            key={cluster.id}
            href={`/guides/${cluster.targetSlug}`}
            id={`guide-preview-${cluster.id}`}
            className="card reveal"
            style={{ animationDelay: `${i * 100}ms`, display: 'block' }}
            role="listitem"
          >
            <div className="card-body">
              <div className="flex-between" style={{ marginBottom: 'var(--space-3)' }}>
                <span className="badge badge-neutral">
                  {cluster.niche.replace(/-/g, ' ')}
                </span>
                {cluster.trend === 'rising' && (
                  <span className="badge badge-accent">📈 Rising</span>
                )}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 700,
                  marginBottom: 'var(--space-3)',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.3,
                }}
              >
                {cluster.keyword.charAt(0).toUpperCase() + cluster.keyword.slice(1)}
              </h3>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: 'var(--space-5)',
                }}
              >
                {cluster.painPoint}
              </p>
              <div className="flex-between">
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    {cluster.searchVolume.toLocaleString()} searches/mo
                  </span>
                  <span style={{ color: 'var(--color-border)' }}>·</span>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: cluster.competition === 'low' ? 'var(--color-success)' : 'var(--color-text-muted)',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {cluster.competition} competition
                  </span>
                </div>
                <span style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                  Read →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
