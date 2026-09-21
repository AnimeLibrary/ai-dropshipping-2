export default function PainBanner() {
  const checks = [
    { step: '01', label: 'Demand proof', detail: 'The product has a real reason to exist, not just a pretty listing.' },
    { step: '02', label: 'Supplier screen', detail: 'Images, price, availability, and sourcing data are reviewed before approval.' },
    { step: '03', label: 'Checkout integrity', detail: 'Final price is created on the server so product data cannot be spoofed.' },
  ]

  return (
    <div className="filter-panel" role="note" aria-label="How Vexsen filters products">
      <div className="filter-panel-copy">
        <span className="badge badge-neutral">The filter</span>
        <h2>
          The trust move is simple: reject more than you list.
        </h2>
        <p>
          A premium store does not need fake urgency. Vexsen now puts the approval process in the open so shoppers can see why a product made it onto the page.
        </p>
      </div>

      <div className="filter-panel-checks">
        {checks.map((item) => (
          <div className="filter-check" key={item.step}>
            <span>{item.step}</span>
            <div>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
