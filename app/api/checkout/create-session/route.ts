import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db/prisma'
import { absoluteUrl } from '@/lib/config/site'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10' as any,
})

const REFERRAL_DISCOUNT = 0.15

function cleanReferralCode(code?: string) {
  return code?.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32) || ''
}

function firstHttpImage(value?: string | null) {
  if (!value) return undefined

  try {
    if (value.startsWith('[')) {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.find((image) => typeof image === 'string' && image.startsWith('http'))
      }
    }
  } catch {}

  return value.startsWith('http') ? value : undefined
}

export async function POST(req: Request) {
  try {
    const { productId, priceId, referralCode, quantity = 1 } = (await req.json()) as {
      productId?: string
      priceId?: string
      referralCode?: string
      quantity?: number
    }

    const orderQuantity = Math.max(1, Math.min(10, Number(quantity) || 1))

    if (!productId) {
      return NextResponse.json({ error: 'Product is required' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: true,
        suppliers: true,
      },
    })

    if (!product || product.validationStatus !== 'approved') {
      return NextResponse.json({ error: 'Product is unavailable' }, { status: 404 })
    }

    const defaultVariant = product.variants.find((variant) => variant.isDefault) || product.variants[0]
    const selectedVariant = priceId
      ? product.variants.find((variant) => variant.stripeVariantPriceId === priceId)
      : defaultVariant

    if (priceId && !selectedVariant && product.stripePriceId !== priceId) {
      return NextResponse.json({ error: 'Invalid product variant' }, { status: 400 })
    }

    const activePrice = selectedVariant ? Number(selectedVariant.retailPrice) : Number(product.price)
    const cost = Number(selectedVariant?.supplierPrice || product.supplierPrice || 0)

    if (!activePrice || activePrice < 1) {
      return NextResponse.json({ error: 'Invalid pricing model' }, { status: 400 })
    }

    if (cost > 0 && (activePrice - cost) / activePrice < 0.2) {
      return NextResponse.json({ error: 'Price is being updated. Please try again later.' }, { status: 422 })
    }

    const supplier = product.suppliers.find((item) => item.isCheapest) || product.suppliers[0]
    const referral = cleanReferralCode(referralCode)

    // Automatic quantity break discount:
    // 2 units -> 15% OFF, 3+ units -> 25% OFF
    let quantityDiscountRate = 0
    if (orderQuantity === 2) quantityDiscountRate = 0.15
    else if (orderQuantity >= 3) quantityDiscountRate = 0.25

    let discountedUnitPrice = activePrice * (1 - quantityDiscountRate)

    let finalPrice = Math.round(discountedUnitPrice * 100) / 100
    let referralId = ''
    let discountAmount = 0

    if (referral) {
      const existingReferral = await prisma.referral.findUnique({ where: { code: referral } })
      if (existingReferral) {
        discountAmount = Math.round(finalPrice * REFERRAL_DISCOUNT * 100) / 100
        finalPrice = Math.round((finalPrice - discountAmount) * 100) / 100
        referralId = existingReferral.id
      }
    }

    const variantLabel = selectedVariant && !selectedVariant.isDefault ? ` - ${selectedVariant.label}` : ''
    const imageUrl = firstHttpImage(selectedVariant?.image || product.heroImage)

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${product.title}${variantLabel}`,
              images: imageUrl ? [imageUrl] : [],
              description: referralId
                ? `You saved $${discountAmount.toFixed(2)} with a referral code.`
                : product.shortDescription || 'Vexsen curated product',
              metadata: {
                productId: product.id,
                supplierUrl: supplier?.url || '',
              },
            },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: orderQuantity,
        },
      ],
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU'],
      },
      phone_number_collection: {
        enabled: true,
      },
      success_url: `${absoluteUrl('/success')}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: absoluteUrl(`/products/${product.slug}`),
      metadata: {
        productId: product.id,
        internal_product_id: product.id,
        referralId,
        discountAmount: String(discountAmount),
        referralCode: referral,
        orderQuantity: String(orderQuantity),
        supplier_url: supplier?.url || '',
        cj_variant_vid: selectedVariant?.vid || product.cjVariantId || '',
      },
    })

    return NextResponse.json({
      url: session.url,
      discountApplied: discountAmount,
      finalPrice,
    })
  } catch (err: any) {
    console.error('[Stripe Session] Error:', err)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
