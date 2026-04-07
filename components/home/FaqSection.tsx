'use client'

import { useState } from 'react'
import Link from 'next/link'

const FAQS = [
  {
    q: 'Wait — is this just another dropshipping site?',
    a: "Honest answer: the model is dropshipping. What's different is the filter. 91% of products we analyze never make it to this site. The ones that do passed three checks: real ad performance data, manual human review, and supplier verification. Most dropshipping sites list everything. We list what's actually working.",
  },
  {
    q: 'How do you choose which products to feature?',
    a: 'Every product goes through a multi-layer validation: trend scoring from Kalodata and Minea, ad performance analysis, and manual human approval before any page goes live. We reject products with low conversion data, questionable quality, or where the supplier can\'t back it up. There\'s a human being who approved every single product you see here.',
  },
  {
    q: 'Are these products actually trending right now?',
    a: 'Yes. Our data pipeline pulls from Kalodata, Minea, and ZIK Analytics — all updated continuously. Trend scores reflect real ad spend, buyer behavior, and search volume. We prioritize rising trends over already-saturated products. If something has already peaked, we pull it.',
  },
  {
    q: 'What makes this different from Amazon?',
    a: "Amazon lists everything and makes you figure out which one works. We don't list products — we diagnose problems. Every guide and product page starts with why the problem happens before we recommend a solution. The product is the conclusion, not the pitch.",
  },
  {
    q: "What if a product doesn't work for me?",
    a: "Contact us within 30 days. We handle returns and work directly with suppliers to make it right. We're incentivized to recommend things that work — if too many products fail, our data pipeline breaks down. Your experience is the feedback signal.",
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
          Real Questions. Straight Answers.
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Including the skeptical ones. Especially the skeptical ones.
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

      {/* Closing hook */}
      <div
        style={{
          marginTop: 'var(--space-10)',
          textAlign: 'center',
          padding: 'var(--space-6)',
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
          Still not sure? Read how real people fixed their exact problem.
        </p>
        <Link href="/guides" id="faq-guides-cta" className="btn btn-secondary btn-sm">
          Read the Problem Guides →
        </Link>
      </div>
    </div>
  )
}
