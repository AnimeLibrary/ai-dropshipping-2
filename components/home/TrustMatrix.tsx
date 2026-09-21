interface TrustMatrixProps {
  productCount: number
}

const BUYER_PROTECTIONS = [
  {
    title: 'Secure checkout',
    detail: 'Payment runs through Stripe with server-side price validation.',
  },
  {
    title: 'Account protection',
    detail: 'Clerk handles sign-in, session security, and customer accounts.',
  },
  {
    title: 'Verified listings',
    detail: 'Products must be approved before they can appear on the storefront.',
  },
  {
    title: 'Clear policies',
    detail: 'Shipping, refund, privacy, and terms pages are linked for buyers and Google.',
  },
]

const PIPELINE = [
  'Trend and usefulness check',
  'Supplier and media review',
  'Margin and checkout validation',
  'Public SEO and policy pass',
]

export default function TrustMatrix({ productCount }: TrustMatrixProps) {
  const liveCount = productCount || 0

  return (
    <section className="section-sm trust-matrix-section" id="trust-matrix" aria-labelledby="trust-matrix-title">
      <div className="container">
        <div className="trust-matrix">
          <div className="trust-matrix-header">
            <span className="badge badge-neutral">Buyer confidence stack</span>
            <h2 id="trust-matrix-title" className="heading-lg">
              Built to feel safer than a random product page.
            </h2>
            <p>
              The frontpage now shows the signals shoppers look for before they risk their card: secure checkout, visible policies, real product approval, and a clear path to support.
            </p>
          </div>

          <div className="trust-scoreboard" aria-label="Live storefront status">
            <div>
              <strong>{liveCount}</strong>
              <span>approved live product{liveCount === 1 ? '' : 's'}</span>
            </div>
            <div>
              <strong>4</strong>
              <span>verification gates</span>
            </div>
            <div>
              <strong>0</strong>
              <span>fake countdowns</span>
            </div>
          </div>

          <div className="trust-grid" role="list" aria-label="Buyer protections">
            {BUYER_PROTECTIONS.map((item) => (
              <div className="trust-tile" role="listitem" key={item.title}>
                <div className="trust-tile-mark" aria-hidden="true" />
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="trust-pipeline" aria-label="Product verification pipeline">
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
