import React from 'react'

export default function RefundPage() {
  return (
    <div style={{ maxWidth: 800, margin: '80px auto', padding: '0 24px', color: 'var(--color-text-primary)', lineHeight: 1.8 }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 24 }}>Refund Policy</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 40 }}>Last updated: April 9, 2026</p>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>30-Day Money Back Guarantee</h2>
        <p>We want you to be 100% satisfied with your purchase. If you're not happy with your order, we offer a 30-day return policy, which means you have 30 days after receiving your item to request a return.</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>Eligibility for Returns</h2>
        <p>To be eligible for a return, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You’ll also need the receipt or proof of purchase.</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>Non-Returnable Items</h2>
        <p>Certain types of items cannot be returned, like perishable goods (such as food, flowers, or plants), custom products (such as special orders or personalized items), and personal care goods (such as beauty products). We also do not accept returns for hazardous materials, flammable liquids, or gases.</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>Refunds</h2>
        <p>We will notify you once we’ve received and inspected your return, and let you know if the refund was approved or not. If approved, you’ll be automatically refunded on your original payment method within 10 business days.</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>Exchanges</h2>
        <p>The fastest way to ensure you get what you want is to return the item you have, and once the return is accepted, make a separate purchase for the new item.</p>
      </section>
    </div>
  )
}
