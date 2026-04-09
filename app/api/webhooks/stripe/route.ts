import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { FulfillmentService, FulfillmentOrder } from '@/lib/services/fulfillment-service'
import { verifyMarginAndGetSupplier } from '@/lib/ai/fulfillment-intelligence'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  const payload = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event: Stripe.Event

  try {
    if (!sig || !endpointSecret) {
      throw new Error('Missing signature or endpoint secret')
    }
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret)
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  // 1. IDEMPOTENCY CHECK
  const existingEvent = await prisma.processedEvent.findUnique({
    where: { eventId: event.id }
  })

  if (existingEvent) {
    console.log(`[Stripe Webhook] Event ${event.id} already processed. Skipping.`)
    return NextResponse.json({ received: true, duplication: true })
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    
    // 2. Extract Order Details
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
    
    // 3. TRANSACTIONAL PERSISTENCE
    try {
      const dbOrder = await prisma.$transaction(async (tx) => {
        // Create the base order
        const createdOrder = await tx.order.create({
          data: {
            stripeSessionId: session.id,
            customerName: session.customer_details?.name || 'Unknown',
            customerEmail: session.customer_details?.email || '',
            customerPhone: session.customer_details?.phone || '',
            totalAmount: (session.amount_total || 0) / 100,
            status: 'processing',
          }
        })

        // Process items and verify margins
        const orderItemsForFulfillment = []

        for (const item of lineItems.data) {
          const productId = item.price?.product as string
          // Note: In production, we'd map Stripe Product ID to our internal Slug/ID
          // For now, assuming Stripe Product metadata or name matches our slug for simplicity
          const productSlug = item.description?.toLowerCase().replace(/\s+/g, '-') || ''
          
          const supplierData = await verifyMarginAndGetSupplier(productSlug)
          
          await tx.orderItem.create({
            data: {
              orderId: createdOrder.id,
              productId: productSlug, // Mapping logic needed here in real scale
              quantity: item.quantity || 1,
              priceAtSale: (item.amount_total || 0) / 100,
              supplierUrl: supplierData.isSafe ? supplierData.url : null
            }
          })

          if (supplierData.isSafe) {
            orderItemsForFulfillment.push({
              productId: productSlug,
              supplierUrl: supplierData.url,
              quantity: item.quantity || 1
            })
          }
        }

        // 4. Log the event as processed
        await tx.processedEvent.create({
          data: {
            eventId: event.id,
            type: event.type
          }
        })

        return { orderId: createdOrder.id, items: orderItemsForFulfillment, customer: createdOrder }
      })

      // 5. TRIGGER FULFILLMENT (After DB is updated)
      if (dbOrder.items.length > 0) {
        const fulfillment = new FulfillmentService()
        const fulfillmentOrder: FulfillmentOrder = {
          orderId: dbOrder.orderId,
          customer: {
            name: dbOrder.customer.customerName,
            email: dbOrder.customer.customerEmail,
            phone: dbOrder.customer.customerPhone || '',
            address: {
              line1: session.shipping_details?.address?.line1 || '',
              city: session.shipping_details?.address?.city || '',
              state: session.shipping_details?.address?.state || '',
              postalCode: session.shipping_details?.address?.postal_code || '',
              country: session.shipping_details?.address?.country || '',
            }
          },
          items: dbOrder.items
        }
        await fulfillment.pushOrderToAutoDS(fulfillmentOrder)
      }
    } catch (dbError) {
      console.error('[Stripe Webhook] DB Transaction failed:', dbError)
      return NextResponse.json({ error: 'Internal persistence error' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}

