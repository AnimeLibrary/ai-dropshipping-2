import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db/prisma'
import { pushOrderToCJ } from '@/lib/cj-dropshipping'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10' as any
})

/**
 * STRIPE WEBHOOK HANDLER — PRODUCTION GRADE
 * Idempotent: uses ProcessedEvent table to prevent double-processing.
 * Writes Order + OrderItems to DB on payment success.
 * Triggers fulfillment check immediately.
 */
export async function POST(req: Request) {
  const body = await req.text()
  const sig = headers().get('Stripe-Signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (err: any) {
    console.error(`[Webhook] Signature verification failed:`, err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // ─── IDEMPOTENCY CHECK ──────────────────────────────────────
  const alreadyProcessed = await prisma.processedEvent.findUnique({
    where: { eventId: event.id }
  })
  if (alreadyProcessed) {
    console.log(`[Webhook] Duplicate event ignored: ${event.id}`)
    return NextResponse.json({ received: true, duplicate: true })
  }

  // ─── HANDLE EVENTS ──────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      // Expand line items to get product details
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items.data.price.product']
      })

      const lineItems = fullSession.line_items?.data || []

      // Write the Order to DB
      const order = await prisma.order.create({
        data: {
          stripeSessionId: session.id,
          customerName: session.customer_details?.name || 'Unknown',
          customerEmail: session.customer_details?.email || '',
          customerPhone: session.customer_details?.phone || null,
          totalAmount: (session.amount_total || 0) / 100,
          status: 'processing',
          orderItems: {
            create: await Promise.all(lineItems.map(async (item) => {
              const stripeProduct = item.price?.product as Stripe.Product | undefined
              const internalId = stripeProduct?.metadata?.productId || 'unknown'
              
              // Look up CJ variant ID for auto-fulfillment
              // Priority 1: Exact Variant VID from Checkout Session metadata
              let cjVariantId: string | null = session.metadata?.cj_variant_vid || null

              // Priority 2: Fallback to DB product default if not in session metadata
              if (!cjVariantId && internalId !== 'unknown') {
                const dbProduct = await prisma.product.findUnique({
                  where: { id: internalId },
                  select: { cjVariantId: true }
                })
                cjVariantId = dbProduct?.cjVariantId || null
              }

              return {
                productId: internalId,
                quantity: item.quantity || 1,
                priceAtSale: (item.amount_total || 0) / 100,
                supplierUrl: stripeProduct?.metadata?.supplierUrl || null,
                cjVariantId,
              }
            }))
          }
        }
      })

      console.log(`[Webhook] ✅ Order created: ${order.id} for ${order.customerName}`)

      // Trigger asynchronous background fulfillment to CJ Dropshipping
      pushOrderToCJ(order.id, session)

      // Mark event as processed (idempotency)
      await prisma.processedEvent.create({
        data: { eventId: event.id, type: event.type }
      })

    } catch (err: any) {
      console.error(`[Webhook] Failed to create order for session ${session.id}:`, err.message)
      // Do NOT mark as processed — Stripe will retry
      return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
    }
  } else {
    // Mark non-order events as processed to prevent noise retries
    await prisma.processedEvent.create({
      data: { eventId: event.id, type: event.type }
    })
    console.log(`[Webhook] Acknowledged event: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
