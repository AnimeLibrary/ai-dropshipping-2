import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10' as any
})

/**
 * STRIPE CHECKOUT SESSION API
 * Handles dynamic 'Surgical' pricing and redirects users to a secure payment page.
 */
export async function POST(req: Request) {
  try {
    const { productId, title, price, imageUrl, bundleItems } = await req.json()

    // 1. Margin Floor Check (Backend Safety Valve)
    // Ensures we NEVER process a payment that doesn't meet our profit rules.
    if (!price || price < 10) {
        return NextResponse.json({ error: 'Invalid Pricing Model' }, { status: 400 })
    }

    // 2. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'klarna', 'afterpay_clearpay'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: title,
              images: imageUrl ? [imageUrl] : [],
              description: bundleItems ? `Includes: ${bundleItems.join(', ')}` : 'Surgical Solution Kit',
            },
            unit_amount: Math.round(price * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU'], // Major dropshipping markets
      },
      success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/`,
      metadata: {
        productId,
        isBundle: !!bundleItems
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[Stripe Session] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
