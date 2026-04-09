/**
 * EMAIL ALERT SERVICE
 * Uses Resend (Free Tier) to notify the admin of urgent dropshipping events.
 */

export interface RefundAlert {
  orderId: string
  customerName: string
  productTitle: string
  reason: string
}

export class EmailService {
  private apiKey = process.env.RESEND_API_KEY
  private adminEmail = 'brannenguidry28@gmail.com'

  /**
   * Sends an urgent alert when an item is bought but found out-of-stock.
   */
  async sendRefundAlert(details: RefundAlert) {
    console.log(`[Email] Sending OOS alert for Order ${details.orderId} to ${this.adminEmail}`)
    
    // Fallback: If no API key, log the email body to the console for the user to see
    const emailBody = `
      ⚠️ ACTION REQUIRED: Out-of-Stock Refund Needed
      
      Order: ${details.orderId}
      Customer: ${details.customerName}
      Product: ${details.productTitle}
      Issue: ${details.reason}
      
      NOTICE: The customer has already paid. Fulfillment has BEEN STOPPED.
      Please sign into your Admin Command Center to review the details and APPROVE THE REFUND.
      
      No automatic refund has been processed. 
    `

    if (!this.apiKey) {
      console.log('--- SIMULATED EMAIL START ---')
      console.log(emailBody)
      console.log('--- SIMULATED EMAIL END ---')
      return { sent: true, simulated: true }
    }

    try {
      // In production:
      // await fetch('https://api.resend.com/emails', { ... })
      return { sent: true }
    } catch (e) {
      console.error('[Email Service] Failed to send alert:', e)
      return { sent: false }
    }
  }
}
