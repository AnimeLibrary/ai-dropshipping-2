import Link from 'next/link'

const FOOTER_LINKS = [
  { href: '/collections', label: 'Collections' },
  { href: '/guides', label: 'Guides' },
  { href: '/bundles', label: 'Bundles' },
  { href: '/problems', label: 'Problems' },
  { href: '/solutions', label: 'Solutions' },
]

const SUPPORT_LINKS = [
  { href: '/about', label: 'About Us' },
  { href: '/legal/shipping', label: 'Shipping Policy' },
  { href: '/legal/refund', label: 'Returns & Refunds' },
  { href: '/legal/privacy', label: 'Privacy Policy' },
  { href: '/contact', label: 'Contact' },
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
              Vexsen
            </p>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
                lineHeight: 1.7,
                maxWidth: 240,
              }}
            >
              Functional design. Uncompromising quality. We build solutions designed to elevate your everyday.
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

          {/* Support Links */}
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
              Support
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {SUPPORT_LINKS.map((link) => (
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
            © {year} Vexsen. All rights reserved.
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Secure Checkout · Guaranteed Quality
          </p>
        </div>
      </div>
    </footer>
  )
}
