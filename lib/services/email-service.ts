/**
 * EMAIL ALERT SERVICE
 * Sends real transactional emails via Resend API.
 * Without RESEND_API_KEY: writes to SystemLog in DB so alerts
 * are never silently dropped — they surface in the admin dashboard.
 */

import { prisma } from '@/lib/db/prisma'

export interface RefundAlert {
  orderId: string
  customerName: string
  productTitle: string
  reason: string
}

export class EmailService {
  private apiKey = process.env.RESEND_API_KEY
  private adminEmail = process.env.ADMIN_EMAIL || 'brannenguidry28@gmail.com'
  private fromEmail = process.env.FROM_EMAIL || 'alerts@trenddrop.store'

  async sendRefundAlert(details: RefundAlert) {
    const subject = `⚠️ Action Required: Refund Needed — ${details.orderId}`
    const html = `
      <h2 style="color:#ef4444">⚠️ Out-of-Stock: Refund Required</h2>
      <table>
        <tr><td><strong>Order ID</strong></td><td>${details.orderId}</td></tr>
        <tr><td><strong>Customer</strong></td><td>${details.customerName}</td></tr>
        <tr><td><strong>Product</strong></td><td>${details.productTitle}</td></tr>
        <tr><td><strong>Reason</strong></td><td>${details.reason}</td></tr>
      </table>
      <p style="color:#ef4444"><strong>Fulfillment has been STOPPED. No charges have been retried. Log into your admin dashboard to confirm the refund.</strong></p>
    `

    if (!this.apiKey) {
      // Write to DB log so it surfaces in admin — never silently lost
      console.warn('[EmailService] RESEND_API_KEY missing. Writing alert to SystemLog.')
      try {
        await prisma.systemLog.create({
          data: {
            level: 'error',
            source: 'email-service',
            message: `UNSENT REFUND ALERT — ${subject}`,
            meta: JSON.stringify(details)
          }
        })
      } catch (dbErr: any) {
        console.error('[EmailService] Failed to write to SystemLog:', dbErr.message)
      }
      return { sent: false, reason: 'No RESEND_API_KEY — logged to DB' }
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: this.adminEmail,
          subject,
          html
        }),
        signal: AbortSignal.timeout(10000)
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(`Resend rejected: ${JSON.stringify(err)}`)
      }

      return { sent: true, source: 'resend' }
    } catch (e: any) {
      console.error('[EmailService] Send failed:', e.message)
      return { sent: false, reason: e.message }
    }
  }
}
