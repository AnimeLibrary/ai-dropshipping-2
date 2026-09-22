'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import VexsenAuthButton from '@/components/auth/VexsenAuthButton'
import { useTheme } from './ThemeProvider'

const NAV_LINKS = [
  { href: '/#trending-products', label: 'Shop Products' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Support' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const pathname = usePathname()
  const isHome = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      <nav
        className={`navbar ${scrolled || !isHome ? 'scrolled' : 'transparent'}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container flex-between" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link href="/" className="nav-logo" aria-label="Vexsen home" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.5rem', letterSpacing: '-0.02em', textDecoration: 'none' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #181824 0%, #0b0b10 100%)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(139,92,246,0.2)'
              }}>
                <svg width="22" height="22" viewBox="0 0 512 512" fill="none">
                  <defs>
                    <linearGradient id="navIcoLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <linearGradient id="navIcoRight" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <linearGradient id="navIcoCore" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <path d="M108 128 L196 128 L256 312 L208 340 L108 128 Z" fill="url(#navIcoLeft)" />
                  <path d="M404 128 L316 128 L256 312 L304 340 L404 128 Z" fill="url(#navIcoRight)" />
                  <path d="M256 168 L286 244 L256 394 L226 244 Z" fill="url(#navIcoCore)" />
                </svg>
              </div>
              <span style={{ fontWeight: 900, background: 'linear-gradient(135deg, #fff 40%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                VEXSEN
              </span>
            </Link>
            <span className="hide-mobile" style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', borderLeft: '1px solid var(--color-border)', paddingLeft: '10px' }}>
              Engineered for Everyday Life
            </span>
          </div>

          <ul className="nav-links hide-mobile" role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  id={`nav-${link.label.toLowerCase()}`}
                  className={`nav-link ${pathname.startsWith(link.href) ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              id="theme-toggle-btn"
              className="theme-toggle"
              data-active={theme === 'dark' ? 'true' : 'false'}
              onClick={toggle}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <span className="theme-toggle-thumb" />
            </button>

            <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center' }}>
              <VexsenAuthButton compact />
            </div>

            <Link href="/solutions" className="btn btn-primary hide-mobile" id="nav-cta">
              Shop Now
            </Link>

            <button
              id="mobile-menu-btn"
              className={`hamburger hide-desktop ${mobileOpen ? 'open' : ''}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label="Toggle mobile menu"
            >
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`mobile-nav ${mobileOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="flex-between" style={{ marginBottom: 'var(--space-10)' }}>
          <Link href="/" className="nav-logo">Vexsen</Link>
          <button
            id="mobile-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            style={{ fontSize: '1.5rem', color: 'var(--color-text-primary)' }}
          >
            x
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              id={`mobile-nav-${link.label.toLowerCase()}`}
              style={{
                padding: 'var(--space-4)',
                fontSize: 'var(--text-xl)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                color: pathname.startsWith(link.href) ? 'var(--color-accent)' : 'var(--color-text-primary)',
                borderRadius: 'var(--radius-lg)',
                transition: 'all var(--transition-fast)',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <VexsenAuthButton fullWidth label="Login" signedInLabel="My Account" />
          <Link href="/solutions" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Shop Now
          </Link>
        </div>
      </div>
    </>
  )
}
