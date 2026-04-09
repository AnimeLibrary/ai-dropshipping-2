import React from 'react'

export default function ShippingPage() {
  return (
    <div style={{ maxWidth: 800, margin: '80px auto', padding: '0 24px', color: 'var(--color-text-primary)', lineHeight: 1.8 }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 24 }}>Shipping Policy</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 40 }}>Last updated: April 9, 2026</p>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>Order Processing Time</h2>
        <p>All orders are processed within 1-3 business days. Orders are not shipped or delivered on weekends or holidays.</p>
        <p>If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please allow additional days in transit for delivery.</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>Shipping Rates & Delivery Estimates</h2>
        <p>Shipping charges for your order will be calculated and displayed at checkout.</p>
        <div style={{ background: 'var(--color-bg-secondary)', padding: 20, borderRadius: 12, marginTop: 16 }}>
            <p style={{ margin: 0 }}><strong>Standard Shipping:</strong> 7-15 business days (FREE on orders over $50)</p>
            <p style={{ margin: '8px 0 0' }}><strong>Express Shipping:</strong> 5-9 business days ($9.99)</p>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 12 }}>*Delivery delays can occasionally occur due to logistics or customs clearance.</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>Shipment Confirmation & Order Tracking</h2>
        <p>You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24-48 hours.</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>Customs, Duties, and Taxes</h2>
        <p>TrendDrop is not responsible for any customs and taxes applied to your order. All fees imposed during or after shipping are the responsibility of the customer (tariffs, taxes, etc.).</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>Damages</h2>
        <p>TrendDrop is not liable for any products damaged or lost during shipping. If you received your order damaged, please contact the shipment carrier to file a claim. Please save all packaging materials and damaged goods before filing a claim.</p>
      </section>
    </div>
  )
}
