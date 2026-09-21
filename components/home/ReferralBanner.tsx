import Link from 'next/link'

export default function ReferralBanner() {
  const steps = [
    { step: '1', text: 'Sign in with the custom Vexsen account button.' },
    { step: '2', text: 'Generate your personal referral code in seconds.' },
    { step: '3', text: 'Friends save 15%. You earn store credit automatically.' },
  ]

  return (
    <section className="referral-panel" id="referral-cta">
      <div className="container referral-panel-inner">
        <div>
          <span className="referral-kicker">Referral program</span>
          <h2>
            Turn happy buyers into your next sales channel.
          </h2>
          <p>
            Referral accounts now use the same reusable Vexsen login design as the rest of the site, so the program feels native instead of bolted on.
          </p>
        </div>

        <div className="referral-steps">
          {steps.map((item) => (
            <div key={item.step} className="referral-step">
              <span>{item.step}</span>
              <p>{item.text}</p>
            </div>
          ))}

          <Link href="/referral" className="referral-button">
            Get My Referral Code
          </Link>
        </div>
      </div>
    </section>
  )
}
