interface TrustMatrixProps {
  productCount: number
}

const BUYER_PROTECTIONS = [
  {
    icon: '🛡️',
    title: '30-Day Risk-Free Guarantee',
    detail: 'Love your item or return it within 30 days for a full, hassle-free refund. No questions asked.',
  },
  {
    icon: '🔒',
    title: 'Bank-Grade 256-Bit Security',
    detail: 'Every transaction is encrypted and securely processed through Stripe. Your card data is never stored.',
  },
  {
    icon: '📦',
    title: 'Tracked & Insured Delivery',
    detail: 'Real-time doorstep tracking updates provided with every order. Covered against loss or transit damage.',
  },
  {
    icon: '💬',
    title: 'Dedicated Human Support',
    detail: 'Real human support available 7 days a week. Quick resolutions for orders, tracking, and inquiries.',
  },
]

const PIPELINE = [
  'Lab Quality & Stress Tested',
  'Verified Supplier Sourcing',
  'Fast Doorstep Fulfillment',
  '100% Satisfaction Backed',
]

export default function TrustMatrix({ productCount }: TrustMatrixProps) {
  return (
    <section className="section-sm trust-matrix-section" id="trust-matrix" aria-labelledby="trust-matrix-title">
      <div className="container">
        <div className="trust-matrix">
          <div className="trust-matrix-header">
            <span className="badge badge-neutral">The Vexsen Standard</span>
            <h2 id="trust-matrix-title" className="heading-lg">
              Engineered for quality. Protected at every step.
            </h2>
            <p>
              We curate and rigorously inspect every solution before it earns a spot in our catalog. Experience risk-free shopping backed by insured shipping and 24/7 dedicated support.
            </p>
          </div>

          <div className="trust-scoreboard" aria-label="Storefront guarantees">
            <div>
              <strong>30-Day</strong>
              <span>Money-back trial</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Insured delivery</span>
            </div>
            <div>
              <strong>256-Bit</strong>
              <span>Encrypted checkout</span>
            </div>
          </div>

          <div className="trust-grid" role="list" aria-label="Buyer protections">
            {BUYER_PROTECTIONS.map((item) => (
              <div className="trust-tile" role="listitem" key={item.title}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="trust-pipeline" aria-label="Product quality pipeline">
            {PIPELINE.map((step, index) => (
              <div className="trust-pipeline-step" key={step}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

