import { prisma } from '@/lib/db/prisma'
import { cj } from '@/lib/services/cj-service'

/**
 * Pushes an order to the CJ Dropshipping API for automated fulfillment.
 * Uses the authenticated CJService singleton to handle token rotation and official V2 payload.
 */
export async function pushOrderToCJ(orderId: string, checkoutSession: any) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (!order || order.items.length === 0) {
      throw new Error(`Order ${orderId} not found or has no items.`)
    }

    // Check if any items have a mapped CJ Variant ID
    const cjItems = order.items.filter(i => !!i.cjVariantId)
    if (cjItems.length === 0) {
      await prisma.order.update({
        where: { id: orderId },
        data: { fulfillmentLog: `[SKIPPED] No cjVariantId mapped for any order items. Manual check required.` }
      })
      return
    }

    // Extract Stripe Shipping Details
    const details = checkoutSession.shipping_details || checkoutSession.customer_details
    if (!details || !details.address) {
      throw new Error('Missing shipping address details in Stripe checkout session.')
    }

    // If CJ is not configured with real credentials, log simulation
    if (!cj.isConfigured()) {
      const log = `[SIMULATED] CJ credentials missing in .env. Would auto-fulfill order with ${cjItems.length} item(s).`
      console.log(log)
      await prisma.order.update({ where: { id: orderId }, data: { fulfillmentLog: log } })
      return
    }

    const customerPhone = details.phone || checkoutSession.customer_details?.phone || '0000000000'

    // Call official CJ Dropshipping createOrder with full token auth
    const result = await cj.createOrder({
      orderId: order.id,
      customerName: details.name || order.customerName,
      customerPhone,
      address: {
        line1: details.address.line1 + (details.address.line2 ? ` ${details.address.line2}` : ''),
        city: details.address.city || '',
        province: details.address.state || details.address.city || '',
        country: details.address.country || 'US',
        zip: details.address.postal_code || '',
      },
      products: cjItems.map(item => ({
        vid: item.cjVariantId!,
        quantity: item.quantity,
        price: item.priceAtSale,
      }))
    })

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'processing',
        fulfillmentLog: `[SUCCESS] Auto-pushed to CJ! CJ Order ID: ${result.cjOrderId || result.orderNum}`,
      }
    })

    await prisma.systemLog.create({
      data: {
        level: 'info',
        source: 'fulfillment:cj-auto',
        message: `Order #${orderId} automatically dispatched to CJ Dropshipping (CJ Order: ${result.cjOrderId})`,
        meta: JSON.stringify({ orderId, cjOrderId: result.cjOrderId, itemsCount: cjItems.length })
      }
    })

  } catch (error: any) {
    console.error('[CJ Fulfillment Error]', error)
    await prisma.order.update({
      where: { id: orderId },
      data: { fulfillmentLog: `[FAILED] ${error.message}` }
    })
    
    await prisma.systemLog.create({
      data: {
        level: 'error',
        source: 'fulfillment:cj-auto',
        message: `Failed auto-dispatch to CJ for order #${orderId}: ${error.message}`,
        meta: JSON.stringify({ orderId, error: error.message })
      }
    })
  }
}
