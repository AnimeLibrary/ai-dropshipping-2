import { prisma } from '../db/prisma'
import { cj } from './cj-service'
import { EmailService } from './email-service'

/**
 * FULFILLMENT DISPATCH SERVICE
 * 
 * Routing logic:
 *   - source = 'kalodata' → MANUAL (you place it yourself in CJ dashboard)
 *   - everything else    → AUTOMATIC via CJ Dropshipping API
 * 
 * CJ Dropshipping is free — just fund your CJ account balance to cover orders.
 */

export interface FulfillmentOrder {
  orderId: string
  productSource: string
  cjVariantId?: string       // CJ product variant ID (stored on product at import time)
  customer: {
    name: string
    email: string
    phone?: string
    address: {
      line1: string
      city: string
      state: string
      postalCode: string
      country: string
    }
  }
  items: Array<{
    productId: string
    supplierUrl?: string | null
    cjVariantId?: string | null
    quantity: number
    price: number
  }>
}

export class FulfillmentService {
  private email = new EmailService()

  async dispatch(order: FulfillmentOrder) {
    const source = (order.productSource || '').toLowerCase()

    // ── Kalodata → flag for manual placement ─────────────────────────────────
    if (source === 'kalodata') {
      return this.flagForManualFulfillment(order)
    }

    // ── CJ Dropshipping not configured → queue to dashboard ──────────────────
    if (!cj.isConfigured()) {
      await this.logToDb('warn', order.orderId, 'CJ_API not configured — add CJ_EMAIL and CJ_API_KEY to .env')
      return { status: 'queued', reason: 'CJ API not configured' }
    }

    // ── All other sources → auto-fulfill via CJ ───────────────────────────────
    return this.fulfillViaCJ(order)
  }

  private async fulfillViaCJ(order: FulfillmentOrder) {
    try {
      // Build CJ product list from order items
      const cjProducts = order.items
        .filter(item => item.cjVariantId)
        .map(item => ({
          vid: item.cjVariantId!,
          quantity: item.quantity,
          price: item.price
        }))

      if (cjProducts.length === 0) {
        // No CJ variant IDs yet — fall back to dashboard link
        await this.logToDb('warn', order.orderId, 'No CJ variant IDs found on order items — route to manual dashboard')
        return { status: 'manual_required', reason: 'No CJ variant IDs. Add CJ products via the Admin chat.' }
      }

      const result = await cj.createOrder({
        orderId: order.orderId,
        customerName: order.customer.name,
        customerPhone: order.customer.phone || '',
        address: {
          line1: order.customer.address.line1,
          city: order.customer.address.city,
          province: order.customer.address.state,
          country: order.customer.address.country,
          zip: order.customer.address.postalCode
        },
        products: cjProducts
      })

      // Update order in DB with CJ order reference
      await prisma.order.update({
        where: { id: order.orderId },
        data: {
          status: 'processing',
          fulfillmentLog: `CJ Order created: ${result.cjOrderId} (${result.orderNum})`
        }
      })

      await this.logToDb('info', order.orderId, `✅ Auto-fulfilled via CJ Dropshipping. CJ Order ID: ${result.cjOrderId}`)

      return { status: 'success', cjOrderId: result.cjOrderId }

    } catch (err: any) {
      await this.logToDb('error', order.orderId, `CJ fulfillment failed: ${err.message}`)
      return { status: 'failed', error: err.message }
    }
  }

  private async flagForManualFulfillment(order: FulfillmentOrder) {
    await this.logToDb(
      'warn',
      order.orderId,
      `⚠️ MANUAL ORDER REQUIRED — Kalodata product. Place in your CJ dashboard manually.\n` +
      `Customer: ${order.customer.name} (${order.customer.email})\n` +
      `Items: ${order.items.map(i => `${i.productId} x${i.quantity}`).join(', ')}`
    )

    await this.email.sendRefundAlert({
      orderId: order.orderId,
      customerName: order.customer.name,
      productTitle: 'Kalodata Product',
      reason: 'Manual order placement required. Check your Admin Dashboard → Logs.'
    })

    return { status: 'manual_required', reason: 'Kalodata product — place in CJ dashboard' }
  }

  private async logToDb(level: 'info' | 'warn' | 'error', orderId: string, message: string) {
    await prisma.systemLog.create({
      data: { level, source: 'fulfillment', message: `[Order #${orderId}] ${message}` }
    })
  }
}
