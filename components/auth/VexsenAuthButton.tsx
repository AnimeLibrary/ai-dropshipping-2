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
  const { isLoaded, isSignedIn } = useUser()

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
    return (
      <div className="auth-signed-in" style={{ width: fullWidth ? '100%' : undefined }}>
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
