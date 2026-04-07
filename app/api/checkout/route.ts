import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getApprovedProducts } from '@/lib/data/products'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function POST(req: Request) {
  try {
    const { productId } = await req.json()
    const product = getApprovedProducts().find((p) => p.id === productId)

    if (!product || !product.stripePriceId) {
      return NextResponse.json(
        { error: 'Product not found or lacks stripePriceId' },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: product.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/products/${product.slug}`,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU'], // adjust to your fulfillment
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
