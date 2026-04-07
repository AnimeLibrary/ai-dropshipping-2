'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'How do you choose which products to feature?',
    a: 'Every product goes through a multi-layer validation process: trend scoring from Kalodata and Minea, ad performance analysis from Pipiads, and manual human review before any page goes live. We reject products with low conversion data or questionable quality signals.',
  },
  {
    q: 'Are these products actually trending right now?',
    a: 'Yes. Our data pipeline pulls from Kalodata, Minea, and ZIK Analytics — all updated continuously. Trend scores reflect real ad spend, buyer behavior, and search volume. We prioritize rising trends over already-saturated products.',
  },
  {
    q: 'What makes TrendDrop different from AliExpress or Amazon?',
    a: 'We don\'t list products — we solve problems. Every collection, guide, and product page starts with the pain point first. We explain why the problem happens before we recommend anything. The product is the conclusion, not the pitch.',
  },
  {
    q: 'How can I trust the quality?',
    a: 'No product goes live without manual validation, supplier verification, and ad performance data. Products tagged "VALIDATED" have passed all three checks. We also show you the data source so you can judge for yourself.',
  },
  {
    q: 'What if a product doesn\'t work for me?',
    a: 'Our store runs on a satisfaction policy — contact us within 30 days. We handle returns and work directly with suppliers to make it right. We\'re incentivized to recommend products that actually work.',
  },
]

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
        <h2 className="heading-xl" style={{ marginBottom: 'var(--space-3)' }}>
          Common Questions
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          The honest answers to what you're thinking.
        </p>
      </div>

      <div role="list" aria-label="Frequently asked questions">
        {FAQS.map((faq, i) => (
          <div
            key={i}
            className={`faq-item ${openIndex === i ? 'open' : ''}`}
            role="listitem"
          >
            <button
              id={`faq-btn-${i}`}
              className="faq-question"
              onClick={() => toggle(i)}
              aria-expanded={openIndex === i}
              aria-controls={`faq-answer-${i}`}
            >
              {faq.q}
              <svg
                className="faq-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <div
              id={`faq-answer-${i}`}
              className="faq-answer"
              role="region"
              aria-labelledby={`faq-btn-${i}`}
            >
              <div className="faq-answer-inner">{faq.a}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
