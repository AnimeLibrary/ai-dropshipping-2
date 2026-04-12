'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { useTheme } from './ThemeProvider'

const NAV_LINKS = [
  { href: '/collections', label: 'Shop' },
  { href: '/guides', label: 'Guides' },
  { href: '/problems', label: 'Problems' },
  { href: '/bundles', label: 'Bundles' },
  { href: '/referral', label: '🎁 Refer & Earn' },
  { href: '/about', label: 'Our Story' },
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

  // Close mobile nav on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  return (
    <>
      <nav
        className={`navbar ${scrolled || !isHome ? 'scrolled' : 'transparent'}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container flex-between" style={{ width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <Link href="/" className="nav-logo" aria-label="Vexsen home" style={{ fontSize: '1.5rem', letterSpacing: '-0.03em' }}>
              Vexsen
            </Link>
            <span className="hide-mobile" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Engineered for everyday
            </span>
          </div>

          {/* Desktop Links */}
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

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {/* Theme Toggle */}
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
              <SignedOut>
                <SignInButton mode="modal">
                  <button 
                    style={{ 
                      background: 'transparent',
                      border: 'none',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--space-2)', 
                      fontSize: 'var(--text-sm)', 
                      fontWeight: 600, 
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>👤</span>
                    Login
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>

            {/* CTA */}
            <Link href="/solutions" className="btn btn-primary hide-mobile" id="nav-cta">
              Shop Now
            </Link>

            {/* Hamburger */}
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

      {/* Mobile Nav Overlay */}
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
            ✕
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
          <SignedOut>
            <SignInButton mode="modal">
              <button 
                style={{ 
                  background: 'transparent',
                  border: 'none',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 'var(--space-2)', 
                  fontSize: 'var(--text-lg)', 
                  fontWeight: 700, 
                  color: 'var(--color-text-primary)' 
                }}
              >
                <span>👤</span> Login
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', padding: 'var(--space-2)' }}>
              <UserButton />
              <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>My Account</span>
            </div>
          </SignedIn>
          <Link href="/solutions" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Shop Now
          </Link>
        </div>
      </div>
    </>
  )
}
