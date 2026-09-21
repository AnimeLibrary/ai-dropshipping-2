'use client'

import Link from 'next/link'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'

interface VexsenAuthButtonProps {
  label?: string
  signedInLabel?: string
  fullWidth?: boolean
  compact?: boolean
}

export default function VexsenAuthButton({
  label = 'Login',
  signedInLabel = 'Account',
  fullWidth = false,
  compact = false,
}: VexsenAuthButtonProps) {
  const { isLoaded, isSignedIn, user } = useUser()

  if (!isLoaded) {
    return (
      <button
        type="button"
        disabled
        className={`auth-trigger auth-trigger-loading ${compact ? 'auth-trigger-compact' : ''}`}
        style={{ width: fullWidth ? '100%' : undefined }}
        aria-label={`${label} loading`}
      >
        <span className="auth-trigger-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span>{label}</span>
      </button>
    )
  }

  if (isSignedIn) {
    const userEmail = (user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '').toLowerCase().trim()
    const isOwner = userEmail === 'brannenguidry28@gmail.com'

    return (
      <div className="auth-signed-in" style={{ width: fullWidth ? '100%' : undefined, display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isOwner && (
          <Link
            href="/admin"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 800,
              padding: '5px 10px',
              borderRadius: '6px',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.4)',
              whiteSpace: 'nowrap'
            }}
          >
            ⚡ Admin
          </Link>
        )}
        <Link href="/account" className="auth-account-link">
          {signedInLabel}
        </Link>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'auth-avatar-box',
              userButtonPopoverCard: 'auth-popover-card',
            },
          }}
        />
      </div>
    )
  }

  return (
    <SignInButton mode="modal">
      <button
        type="button"
        className={`auth-trigger ${compact ? 'auth-trigger-compact' : ''}`}
        style={{ width: fullWidth ? '100%' : undefined }}
        aria-label={label}
      >
        <span className="auth-trigger-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span>{label}</span>
      </button>
    </SignInButton>
  )
}
