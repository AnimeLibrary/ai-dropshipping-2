'use client'

import { useEffect, useState } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'

interface ReferralData {
  code: string
  creditsEarned: number
  uses: { id: string; status: string; discountAmount: number; creditAwarded: number; createdAt: string }[]
}

export default function ReferralPage() {
  const { isSignedIn, user } = useUser()
  const [referral, setReferral] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const referralLink = referral
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/collections?ref=${referral.code}`
    : ''

  useEffect(() => {
    if (!isSignedIn) return
    setLoading(true)
    fetch('/api/referral/generate', { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (d.referral) setReferral(d.referral)
      })
      .finally(() => setLoading(false))
  }, [isSignedIn])

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isSignedIn) {
    return (
      <main style={{ paddingTop: 'var(--nav-height)', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 480, padding: 'var(--space-8)' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--space-4)' }}>🎁</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)' }}>
            Earn with every friend you refer
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-lg)', lineHeight: 1.7, marginBottom: 'var(--space-8)' }}>
            Share your unique promo code. When a friend buys using it, they get <strong>15% off</strong> and you earn <strong>store credits</strong>.
          </p>
          <SignInButton mode="modal">
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Sign in to get your code →
            </button>
          </SignInButton>
        </div>
      </main>
    )
  }

  return (
    <main style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-12) 0 var(--space-8)'
      }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 'var(--space-3)' }}>
            Referral Program
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.025em', marginBottom: 'var(--space-3)' }}>
            Give 15% off. Earn credits.
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-lg)', lineHeight: 1.6 }}>
            Share your code with anyone. When they buy using it, they instantly save 15% — and you earn store credits towards your next order.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, padding: 'var(--space-10) var(--space-6)' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : referral ? (
          <>
            {/* Your Code */}
            <div style={{
              background: 'var(--color-bg-secondary)', border: '2px dashed var(--color-accent)',
              borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)',
              textAlign: 'center', marginBottom: 'var(--space-6)'
            }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)', fontWeight: 600 }}>
                YOUR PROMO CODE
              </p>
              <p style={{
                fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                fontWeight: 900, color: 'var(--color-text-primary)', letterSpacing: '0.05em',
                marginBottom: 'var(--space-6)'
              }}>
                {referral.code}
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => copy(referral.code)}
                  className="btn btn-primary"
                >
                  {copied ? '✓ Copied!' : '📋 Copy Code'}
                </button>
                <button
                  onClick={() => copy(referralLink)}
                  className="btn btn-secondary"
                >
                  🔗 Copy Link
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
              {[
                { label: 'Total Referrals', value: referral.uses?.length ?? 0, icon: '👥' },
                { label: 'Credits Earned', value: `$${(referral.creditsEarned || 0).toFixed(2)}`, icon: '💰' },
                { label: 'Friends Saved', value: `$${((referral.uses?.length ?? 0) * 7.5).toFixed(2)}`, icon: '🛡️' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', textAlign: 'center'
                }}>
                  <p style={{ fontSize: '1.5rem', marginBottom: 4 }}>{stat.icon}</p>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>{stat.value}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-6)' }}>How it works</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {[
                  { step: '1', title: 'Share your code', desc: 'Send your promo code or referral link to a friend via text, DM, or social.' },
                  { step: '2', title: 'They save 15%', desc: 'When they enter your code at checkout, 15% is automatically taken off their order.' },
                  { step: '3', title: 'You earn credits', desc: 'Once their order is confirmed, store credits are added to your account automatically.' },
                ].map(item => (
                  <div key={item.step} style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                    <span style={{
                      background: 'var(--color-accent)', color: '#fff',
                      width: 28, height: 28, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.8rem', flexShrink: 0
                    }}>{item.step}</span>
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 2 }}>{item.title}</p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral history */}
            {referral.uses && referral.uses.length > 0 && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)' }}>Referral History</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {referral.uses.map((use) => (
                    <div key={use.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <div>
                        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>Order placed</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{new Date(use.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-success)' }}>+${use.creditAwarded.toFixed(2)} credit</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{use.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>Something went wrong generating your code. Try refreshing.</p>
          </div>
        )}
      </div>
    </main>
  )
}
