import { Product, Supplier } from '../data/products'
import { StockService } from './stock-service'
import { EmailService } from './email-service'

/**
 * AUTODS FULFILLMENT SERVICE
 * Handles communication with the AutoDS API to place automated orders.
 */

export interface FulfillmentOrder {
  orderId: string
  customer: {
    name: string
    email: string
    phone: string
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
    supplierUrl: string
    quantity: number
  }>
}

export class FulfillmentService {
  private apiKey = process.env.AUTODS_API_KEY

  /**
   * Pushes an order to AutoDS.
   * If it's a bundle, this will be called for each item or once for the linked bundle SKU.
   */
  async pushOrderToAutoDS(order: FulfillmentOrder) {
    console.log(`[Fulfillment] Pushing order ${order.orderId} to AutoDS...`)
    
    const stock = new StockService()
    const email = new EmailService()

    // 1. FINAL STOCK CHECK (Broke Dropshipper Safety Valve)
    for (const item of order.items) {
      const stockResult = await stock.checkStock(item.supplierUrl)
      if (stockResult.count <= 0) {
        console.error(`[Fulfillment] CRITICAL: Product ${item.productId} is OUT OF STOCK. Stopping order.`)
        
        // Trigger Email Alert
        await email.sendRefundAlert({
          orderId: order.orderId,
          customerName: order.customer.name,
          productTitle: item.productId,
          reason: 'Item went out of stock between purchase and fulfillment.'
        })

        return { status: 'FLAGGED_FOR_REFUND', reason: 'Stock exhausted' }
      }
    }

    if (!this.apiKey) {
      console.warn('[Fulfillment] No AutoDS API key found. Order queued locally.')
      return { status: 'queued', reason: 'Api key missing' }
    }

    try {
      // In production, this would be a real call to:
      // https://api.autods.com/v1/orders
      const response = await fetch('https://api.autods.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.mapOrderToAutoDS(order))
      })

      if (!response.ok) throw new Error('AutoDS API rejected the order')

      return { status: 'success', trackingId: null }
    } catch (error) {
      console.error('[Fulfillment] AutoDS Push failed:', error)
      return { status: 'failed', error }
    }
  }

  private mapOrderToAutoDS(order: FulfillmentOrder) {
    // Mapping our internal Stripe-pushed order to AutoDS expected schema
    return {
      external_id: order.orderId,
      shipping_address: order.customer.address,
      recipient_name: order.customer.name,
      recipient_phone: order.customer.phone,
      products: order.items.map(item => ({
        url: item.supplierUrl,
        quantity: item.quantity
      }))
    }
  }
}
