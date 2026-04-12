import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Vexsen — Why We Built This',
  description:
    'We got tired of buying internet products that broke in a week or never delivered. So we built Vexsen — a strict curation brand that only puts the 1% through.',
}

export default function AboutPage() {
  return (
    <main style={{ paddingTop: 'var(--nav-height)' }}>

      {/* ── Hero: Problem Statement ── */}
      <section style={{
        background: 'linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-20) 0 var(--space-16)',
      }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <span style={{
            display: 'inline-block',
            fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-5)'
          }}>
            Our Story
          </span>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.25rem, 6vw, 4rem)',
            fontWeight: 800, lineHeight: 1.08,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.03em',
            marginBottom: 'var(--space-6)'
          }}>
            We got tired of<br />
            <span style={{ color: 'var(--color-accent)' }}>buying internet garbage.</span>
          </h1>
          <p style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)', color: 'var(--color-text-secondary)', lineHeight: 1.75, maxWidth: 620 }}>
            So we built something different. This is why Vexsen exists, what we actually do, and why we think most product brands are lying to you.
          </p>
        </div>
      </section>

      {/* ── The Problem ── */}
      <section style={{ padding: 'var(--space-20) 0', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-8)', letterSpacing: '-0.025em' }}>
            The problem nobody talks about.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              Every year, millions of people buy products online that promise to fix something real — back pain, poor sleep, cluttered homes, stressed pets. They get hyped by an ad, click buy, and wait.
            </p>
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              Then the package arrives. And it&apos;s smaller than they expected, cheaper-feeling than the photos, and within 2 weeks it&apos;s either broken or just… sitting in a drawer. The problem they bought it to solve? Still there.
            </p>
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)', fontWeight: 600, lineHeight: 1.8 }}>
              We did this too. Multiple times. And we got frustrated enough to do something about it.
            </p>
          </div>
        </div>
      </section>

      {/* ── Why Most Products Fail ── */}
      <section style={{ padding: 'var(--space-20) 0', background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-6)', letterSpacing: '-0.025em' }}>
            Why most products fail you.
          </h2>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-8)' }}>
            It&apos;s not bad luck. There are three consistent reasons products disappoint:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[
              {
                num: '01',
                title: 'They optimize for going viral, not for working',
                body: 'A product that looks incredible in a TikTok video gets ordered in bulk. Nobody tested if it actually solves the problem long-term. It just needed to be convincing for 15 seconds.'
              },
              {
                num: '02',
                title: 'They race to the cheapest possible version',
                body: 'The moment something gets popular, a dozen factories produce cheaper knock-offs that cut corners on materials, tolerances, and durability. Margins go up. Quality collapses.'
              },
              {
                num: '03',
                title: 'Nobody vouches for them honestly',
                body: 'Reviews are gamed. Influencers are paid. Return windows are designed to expire before you realize the product failed. There\'s no accountability baked into the system.'
              }
            ].map((item) => (
              <div key={item.num} style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                display: 'flex',
                gap: 'var(--space-5)',
                alignItems: 'flex-start'
              }}>
                <span style={{
                  fontFamily: 'var(--font-heading)', fontSize: '0.75rem',
                  fontWeight: 800, color: 'var(--color-accent)',
                  letterSpacing: '0.1em', marginTop: '3px', flexShrink: 0
                }}>{item.num}</span>
                <div>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-lg)' }}>{item.title}</p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Vexsen Answer ── */}
      <section style={{ padding: 'var(--space-20) 0', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-6)', letterSpacing: '-0.025em' }}>
            What we do instead.
          </h2>

          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-8)' }}>
            Vexsen isn&apos;t a manufacturer. We&apos;re a filter. We survey hundreds of trending products across every major niche — posture, sleep, home, pets, productivity — and we run them through a strict rejection process before we&apos;ll consider stocking them.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-10)' }}>
            {[
              { icon: '🔍', title: 'Material audit', desc: 'We dig into supplier specs. If the build quality is compromised to hit a low price point, it gets cut.' },
              { icon: '🎯', title: 'Outcome validation', desc: 'Does it actually solve the specific problem in a specific way? We require a mechanism, not just a claim.' },
              { icon: '📦', title: 'Fulfillment reality-check', desc: 'Can we ship it reliably? Tracking numbers. Real delivery windows. No ambiguity.' },
              { icon: '🤝', title: 'We back what we sell', desc: 'If it fails you, we refund it or credit you. Period. That keeps us honest about what we stock.' },
            ].map((item) => (
              <div key={item.icon} style={{
                padding: 'var(--space-5)', background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)'
              }}>
                <span style={{ fontSize: '1.4rem', display: 'block', marginBottom: 'var(--space-3)' }}>{item.icon}</span>
                <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>{item.title}</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)', fontWeight: 600, lineHeight: 1.8 }}>
            The result: a smaller catalog than most stores. On purpose. Because 12 things that genuinely work is more valuable than 500 things that mostly disappoint.
          </p>
        </div>
      </section>

      {/* ── The Promise ── */}
      <section style={{ padding: 'var(--space-20) 0', background: 'var(--color-bg-secondary)' }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-6)', letterSpacing: '-0.025em' }}>
            What you can expect from us.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', marginBottom: 'var(--space-10)' }}>
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              Every product on this site has passed our internal review. That doesn&apos;t mean it&apos;s perfect for you — preferences are personal. But it means we genuinely believe each product delivers the core outcome it claims to deliver.
            </p>
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              If your item is defective or never arrives, we refund you completely. If it arrives and you just didn&apos;t love it, we issue store credit — because your money should stay working for you, not disappear into a dispute.
            </p>
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              This store will never have thousands of products. We&apos;ll always be selective. And every time we add something new, it has to clear the same bar.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Link href="/" className="btn btn-primary btn-lg">
              Shop the Collection →
            </Link>
            <Link href="/policies/refund" className="btn btn-secondary btn-lg">
              Read Our Refund Policy
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
