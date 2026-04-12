import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10' as any
})

const REFERRAL_DISCOUNT = 0.15 // 15%
const CREDIT_PER_REFERRAL = 5.00 // $5 store credit for referrer per confirmed order

export async function POST(req: Request) {
  try {
    const { productId, title, price, imageUrl, bundleItems, referralCode } = await req.json()

    if (!price || price < 10) {
      return NextResponse.json({ error: 'Invalid Pricing Model' }, { status: 400 })
    }

    // ── Referral Code Validation ──────────────────────────────────────────────
    let finalPrice = price
    let referralId: string | null = null
    let discountAmount = 0

    if (referralCode) {
      const code = referralCode.toUpperCase().trim()
      const referral = await prisma.referral.findUnique({ where: { code } })

      if (referral) {
        discountAmount = Math.round(price * REFERRAL_DISCOUNT * 100) / 100
        finalPrice = Math.round((price - discountAmount) * 100) / 100
        referralId = referral.id
      }
    }

    // ── Stripe Checkout Session ───────────────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: referralId
                ? `${title} (15% Referral Discount Applied)`
                : title,
              images: imageUrl ? [imageUrl] : [],
              description: bundleItems
                ? `Includes: ${bundleItems.join(', ')}`
                : referralId
                ? `You saved $${discountAmount.toFixed(2)} with a referral code!`
                : 'Vexsen Curated Product',
            },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU'],
      },
      success_url: `${req.headers.get('origin') || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin') || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/`,
      metadata: {
        productId,
        isBundle: String(!!bundleItems),
        referralId: referralId || '',
        discountAmount: String(discountAmount),
        referralCode: referralCode || '',
      }
    })

    return NextResponse.json({
      url: session.url,
      discountApplied: referralId ? discountAmount : 0,
      finalPrice,
    })
  } catch (err: any) {
    console.error('[Stripe Session] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
