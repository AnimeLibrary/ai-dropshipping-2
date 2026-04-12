import { prisma } from '@/lib/db/prisma'

interface CJOrderPayload {
  orderNumber: string;
  shippingAddress: {
    name: string;
    email: string;
    phone: string;
    address: string; // Combined lines
    city: string;
    state: string;
    zipCode: string;
    country: string; // ISO 2-letter code, e.g. "US"
  };
  items: { vid: string; quantity: number }[];
}

/**
 * Pushes an order to the CJ Dropshipping API for automated fulfillment.
 * @param orderId the internal Vexsen order ID
 * @param event the Stripe Checkout Session event payload containing address data
 */
export async function pushOrderToCJ(orderId: string, checkoutSession: any) {
  const cjApiKey = process.env.CJ_API_KEY || ''
  
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true }
    })

    if (!order || order.orderItems.length === 0) {
      throw new Error(`Order ${orderId} not found or has no items.`)
    }

    // Check if any items have a mapped CJ Variant ID
    const cjItems = order.orderItems.filter(i => !!i.cjVariantId)
    if (cjItems.length === 0) {
      await prisma.order.update({
        where: { id: orderId },
        data: { fulfillmentLog: `[SKIPPED] No cjVariantId mapped for any order items. Manual fulfillment required.` }
      })
      return
    }

    // Extract Stripe Shipping Details
    const details = checkoutSession.shipping_details
    if (!details || !details.address) {
      throw new Error('Missing shipping details in Stripe session.')
    }

    // Construct CJ Payload (V2.0 Order API format)
    const payload = {
      orderNumber: order.id,
      shippingZip: details.address.postal_code || '',
      shippingCountry: details.address.country || 'US',
      shippingProvince: details.address.state || '',
      shippingCity: details.address.city || '',
      shippingAddress: details.address.line1 + (details.address.line2 ? ` ${details.address.line2}` : ''),
      shippingCustomerName: details.name || order.customerName,
      shippingPhone: details.phone || '',
      remark: 'Dropshipping order via Vexsen',
      products: cjItems.map(item => ({
        vid: item.cjVariantId,
        quantity: item.quantity
      }))
    }

    // If no API key is set, we just simulate success (sandbox mode)
    if (!cjApiKey) {
      const log = `[SIMULATED] CJ Dropshipping API key missing. Would have sent payload: ${JSON.stringify(payload)}`
      console.log(log)
      await prisma.order.update({ where: { id: orderId }, data: { fulfillmentLog: log } })
      return
    }

    // Execute API Call to CJ
    const res = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': cjApiKey
      },
      body: JSON.stringify(payload)
    })

    const responseData = await res.json()

    if (responseData.code !== 200) {
      throw new Error(`CJ API Error: ${responseData.message}`)
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { fulfillmentLog: `[SUCCESS] Order pushed to CJ successfully. Order ID: ${responseData.data?.orderId}` }
    })

  } catch (error: any) {
    console.error('[CJ Fulfillment Error]', error)
    await prisma.order.update({
      where: { id: orderId },
      data: { fulfillmentLog: `[FAILED] ${error.message}` }
    })
    
    // Log to system logs for admin review
    await prisma.systemLog.create({
      data: {
        level: 'error',
        source: 'fulfillment:cj-dropshipping',
        message: `Failed to push order to CJ`,
        meta: JSON.stringify({ orderId, error: error.message })
      }
    })
  }
}
