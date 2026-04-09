import Link from 'next/link'

const FOOTER_LINKS = [
  { href: '/collections', label: 'Collections' },
  { href: '/guides', label: 'Guides' },
  { href: '/bundles', label: 'Bundles' },
  { href: '/problems', label: 'Problems' },
  { href: '/solutions', label: 'Solutions' },
]

const LEGAL_LINKS = [
  { href: '/legal/privacy', label: 'Privacy Policy' },
  { href: '/legal/refund', label: 'Refund Policy' },
  { href: '/legal/shipping', label: 'Shipping Policy' },
  { href: '/legal/terms', label: 'Terms of Service' },
]

const DISCOVERY_LINKS = [
  { href: '/guides', label: 'Problem Guides' },
  { href: '/solutions', label: 'Solution Comparisons' },
  { href: '/bundles', label: 'Triple-Threat Bundles' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-10)',
            marginBottom: 'var(--space-12)',
          }}
        >
          {/* Brand */}
          <div>
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-xl)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                marginBottom: 'var(--space-3)',
              }}
            >
              Trend<span style={{ color: 'var(--color-accent)' }}>Drop</span>
            </p>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
                lineHeight: 1.7,
                maxWidth: 240,
              }}
            >
              AI-powered product discovery. Real problems, real solutions, trending products curated by data.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <p
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Shop
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Discovery Links */}
          <div>
            <p
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Discovery
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {DISCOVERY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <p
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Legal
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divider" style={{ margin: '0 0 var(--space-6)' }} />

        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            © {year} TrendDrop. All rights reserved.
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Powered by AI · Data from Kalodata & Minea · Hosted on Vercel
          </p>
        </div>
      </div>
    </footer>
  )
}
