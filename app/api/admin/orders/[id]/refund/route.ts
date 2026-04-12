import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10' as any
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: orderId } = params
    const { action } = await req.json() // 'refund' | 'store_credit'

    if (!orderId) return NextResponse.json({ error: 'Order ID required' }, { status: 400 })

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (order.status === 'refunded' || order.status === 'credited') {
      return NextResponse.json({ error: 'Order already processed for returns' }, { status: 400 })
    }

    if (action === 'refund') {
      // 1. Fetch the Stripe Session to get the payment intent
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId, { expand: ['payment_intent'] })
      
      const paymentIntentId = (session.payment_intent as Stripe.PaymentIntent)?.id
      if (!paymentIntentId) {
         return NextResponse.json({ error: 'No valid payment intent found for this order.' }, { status: 400 })
      }

      // 2. Issue the refund via Stripe API
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer'
      })

      // 3. Update local DB status
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'refunded', fulfillmentLog: 'Admin manually triggered full refund via Stripe.' }
      })

      return NextResponse.json({ success: true, message: 'Refund issued successfully.' })

    } else if (action === 'store_credit') {
      // For Store Credit, we intercept and generate a high-value Referral Use or generic Credit
      // Since Store Credits act as discounts for future orders, we can either:
      // generate a unique 100% off promo code, or integrate with a dedicated `CustomerCredit` model.
      
      // For now, we update the state and log it.
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'credited', fulfillmentLog: `Admin issued $${order.totalAmount} in theoretical store credit (manual code mapping required).` }
      })
      
      return NextResponse.json({ success: true, message: `Store credit logged for $${order.totalAmount.toFixed(2)}.` })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (err) {
    console.error('[admin/refund]', err)
    return NextResponse.json({ error: 'Refund process failed' }, { status: 500 })
  }
}
