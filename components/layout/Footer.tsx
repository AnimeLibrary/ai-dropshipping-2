import Link from 'next/link'

const FOOTER_LINKS = [
  { href: '/#trending-products', label: 'All Products' },
  { href: '/about', label: 'About Vexsen' },
  { href: '/contact', label: 'Customer Support' },
]

const SUPPORT_LINKS = [
  { href: '/legal/shipping', label: 'Shipping Policy' },
  { href: '/legal/refund', label: 'Returns & Refunds' },
  { href: '/legal/privacy', label: 'Privacy Policy' },
  { href: '/contact', label: 'Contact Us' },
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #181824 0%, #0b0b10 100%)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 512 512" fill="none">
                  <path
                    d="M120 130 L220 130 L256 260 L292 130 L392 130 L296 382 C280 422 232 422 216 382 Z"
                    fill="url(#footVexGrad)"
                  />
                  <path d="M256 310 L280 180 L232 180 Z" fill="#0b0b10" opacity="0.9" />
                  <defs>
                    <linearGradient id="footVexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="50%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  background: 'linear-gradient(135deg, #fff 40%, #c4b5fd 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                VEXSEN
              </p>
            </div>
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
