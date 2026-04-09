import React from 'react'

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800, margin: '80px auto', padding: '0 24px', color: 'var(--color-text-primary)', lineHeight: 1.8 }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 24 }}>Privacy Policy</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 40 }}>Last updated: April 9, 2026</p>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>1. Information We Collect</h2>
        <p>When you visit TrendDrop, we automatically collect certain information about your device, including information about your web browser, IP address, and time zone. Additionally, as you browse the Site, we collect information about the individual web pages or products that you view.</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>2. How Do We Use Your Personal Information?</h2>
        <p>We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations).</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>3. Sharing Your Personal Information</h2>
        <p>We share your Personal Information with third parties to help us use your Personal Information, as described above. For example, we use Stripe to power our online store. We also use Clerk for identity management and AutoDS for automated fulfillment.</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>4. Your Rights</h2>
        <p>If you are a European resident, you have the right to access personal information we hold about you and to ask that your personal information be corrected, updated, or deleted.</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>5. Contact Us</h2>
        <p>For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at brannenguidry28@gmail.com.</p>
      </section>
    </div>
  )
}
