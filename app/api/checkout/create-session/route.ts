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
    const body = await req.json()
    const { productId, priceId, variantId, referralCode, quantity = 1, items } = body as {
      productId?: string
      priceId?: string
      variantId?: string
      referralCode?: string
      quantity?: number
      items?: Array<{
        productId: string
        variantId?: string
        vid?: string
        quantity: number
        title?: string
        variantLabel?: string
      }>
    }

    const referral = cleanReferralCode(referralCode)
    let referralId = ''
    let discountAmount = 0

    if (referral) {
      const existingReferral = await prisma.referral.findUnique({ where: { code: referral } })
      if (existingReferral) {
        referralId = existingReferral.id
      }
    }

    // ── CASE 1: MULTI-ITEM CART CHECKOUT ──────────────────────
    if (items && Array.isArray(items) && items.length > 0) {
      const productIds = Array.from(new Set(items.map(i => i.productId).filter(Boolean)))
      if (productIds.length === 0) {
        return NextResponse.json({ error: 'Cart has no valid items' }, { status: 400 })
      }

      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          variants: true,
          suppliers: true,
        },
      })

      const totalCartQuantity = items.reduce((acc, i) => acc + Math.max(1, Math.min(10, Number(i.quantity) || 1)), 0)

      // Quantity break discount across multi-item cart:
      // 2 units -> 15% OFF, 3+ units -> 25% OFF
      let quantityDiscountRate = 0
      if (totalCartQuantity === 2) quantityDiscountRate = 0.15
      else if (totalCartQuantity >= 3) quantityDiscountRate = 0.25

      const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = []
      const orderMetaItems: Array<{ productId: string; cjVariantId: string; quantity: number }> = []

      let rawSubtotal = 0

      for (const item of items) {
        const product = dbProducts.find(p => p.id === item.productId)
        if (!product || product.validationStatus !== 'approved') continue

        const itemQty = Math.max(1, Math.min(10, Number(item.quantity) || 1))

        // Match variant by variantId, vid, or default
        const selectedVariant =
          product.variants.find(v => v.id === item.variantId || v.vid === item.vid || v.stripeVariantPriceId === item.variantId) ||
          product.variants.find(v => v.isDefault) ||
          product.variants[0]

        const activePrice = selectedVariant ? Number(selectedVariant.retailPrice) : Number(product.price)
        if (!activePrice || activePrice < 1) continue

        let unitPrice = activePrice * (1 - quantityDiscountRate)
        if (referralId) {
          unitPrice = unitPrice * (1 - REFERRAL_DISCOUNT)
        }
        const finalUnitPrice = Math.round(unitPrice * 100) / 100

        rawSubtotal += finalUnitPrice * itemQty

        const variantLabel = selectedVariant && !selectedVariant.isDefault ? ` - ${selectedVariant.label}` : ''
        const imageUrl = firstHttpImage(selectedVariant?.image || product.heroImage)
        const supplier = product.suppliers.find((s) => s.isCheapest) || product.suppliers[0]
        const cjVariantVid = selectedVariant?.vid || product.cjVariantId || ''

        line_items.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${product.title}${variantLabel}`,
              images: imageUrl ? [imageUrl] : [],
              description: referralId
                ? `Special 15% referral discount applied.`
                : product.shortDescription || 'Vexsen verified essential',
              metadata: {
                productId: product.id,
                variantId: selectedVariant?.id || '',
                cjVariantId: cjVariantVid,
                supplierUrl: supplier?.url || '',
              },
            },
            unit_amount: Math.round(finalUnitPrice * 100),
          },
          quantity: itemQty,
        })

        orderMetaItems.push({
          productId: product.id,
          cjVariantId: cjVariantVid,
          quantity: itemQty,
        })
      }

      if (line_items.length === 0) {
        return NextResponse.json({ error: 'No purchasable items found in cart' }, { status: 400 })
      }

      const isFreeShipping = rawSubtotal >= 60

      const session = await stripe.checkout.sessions.create({
        line_items,
        mode: 'payment',
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU'],
        },
        shipping_options: [
          ...(isFreeShipping
            ? [
                {
                  shipping_rate_data: {
                    type: 'fixed_amount' as const,
                    fixed_amount: { amount: 0, currency: 'usd' },
                    display_name: 'FREE Standard Tracked & Insured Delivery (Over $60)',
                    delivery_estimate: {
                      minimum: { unit: 'business_day' as const, value: 7 },
                      maximum: { unit: 'business_day' as const, value: 12 },
                    },
                  },
                },
              ]
            : [
                {
                  shipping_rate_data: {
                    type: 'fixed_amount' as const,
                    fixed_amount: { amount: 495, currency: 'usd' },
                    display_name: 'Standard Tracked & Insured Delivery',
                    delivery_estimate: {
                      minimum: { unit: 'business_day' as const, value: 7 },
                      maximum: { unit: 'business_day' as const, value: 12 },
                    },
                  },
                },
              ]),
          {
            shipping_rate_data: {
              type: 'fixed_amount' as const,
              fixed_amount: { amount: 895, currency: 'usd' },
              display_name: 'Priority Insured & Expedited Dispatch',
              delivery_estimate: {
                minimum: { unit: 'business_day' as const, value: 4 },
                maximum: { unit: 'business_day' as const, value: 8 },
              },
            },
          },
        ],
        automatic_tax: { enabled: false },
        phone_number_collection: { enabled: true },
        success_url: `${absoluteUrl('/success')}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: absoluteUrl('/collections'),
        metadata: {
          cart_checkout: 'true',
          cart_items: JSON.stringify(orderMetaItems),
          referralId,
          referralCode: referral,
          totalCartQuantity: String(totalCartQuantity),
        },
      })

      return NextResponse.json({ url: session.url })
    }

    // ── CASE 2: SINGLE PRODUCT DIRECT BUY NOW ───────────────────
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
    const selectedVariant = variantId
      ? product.variants.find((variant) => variant.id === variantId || variant.vid === variantId) || defaultVariant
      : priceId
      ? product.variants.find(
          (variant) =>
            variant.stripeVariantPriceId === priceId ||
            variant.id === priceId ||
            variant.vid === priceId
        ) || defaultVariant
      : defaultVariant

    const activePrice = selectedVariant ? Number(selectedVariant.retailPrice) : Number(product.price)
    const cost = Number(selectedVariant?.supplierPrice || product.supplierPrice || 0)

    if (!activePrice || activePrice < 1) {
      return NextResponse.json({ error: 'Invalid pricing model' }, { status: 400 })
    }

    if (cost > 0 && (activePrice - cost) / activePrice < 0.15) {
      return NextResponse.json({ error: 'Price is being updated. Please try again later.' }, { status: 422 })
    }

    const supplier = product.suppliers.find((item) => item.isCheapest) || product.suppliers[0]

    // Automatic quantity break discount:
    // 2 units -> 15% OFF, 3+ units -> 25% OFF
    let quantityDiscountRate = 0
    if (orderQuantity === 2) quantityDiscountRate = 0.15
    else if (orderQuantity >= 3) quantityDiscountRate = 0.25

    let discountedUnitPrice = activePrice * (1 - quantityDiscountRate)
    let finalPrice = Math.round(discountedUnitPrice * 100) / 100

    if (referralId) {
      discountAmount = Math.round(finalPrice * REFERRAL_DISCOUNT * 100) / 100
      finalPrice = Math.round((finalPrice - discountAmount) * 100) / 100
    }

    const variantLabel = selectedVariant && !selectedVariant.isDefault ? ` - ${selectedVariant.label}` : ''
    const imageUrl = firstHttpImage(selectedVariant?.image || product.heroImage)
    const cjVariantVid = selectedVariant?.vid || product.cjVariantId || ''

    const isFreeShipping = finalPrice * orderQuantity >= 60

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
                variantId: selectedVariant?.id || '',
                cjVariantId: cjVariantVid,
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
      shipping_options: [
        ...(isFreeShipping
          ? [
              {
                shipping_rate_data: {
                  type: 'fixed_amount' as const,
                  fixed_amount: { amount: 0, currency: 'usd' },
                  display_name: 'FREE Standard Tracked & Insured Delivery (Over $60)',
                  delivery_estimate: {
                    minimum: { unit: 'business_day' as const, value: 7 },
                    maximum: { unit: 'business_day' as const, value: 12 },
                  },
                },
              },
            ]
          : [
              {
                shipping_rate_data: {
                  type: 'fixed_amount' as const,
                  fixed_amount: { amount: 495, currency: 'usd' },
                  display_name: 'Standard Tracked & Insured Delivery',
                  delivery_estimate: {
                    minimum: { unit: 'business_day' as const, value: 7 },
                    maximum: { unit: 'business_day' as const, value: 12 },
                  },
                },
              },
            ]),
        {
          shipping_rate_data: {
            type: 'fixed_amount' as const,
            fixed_amount: { amount: 895, currency: 'usd' },
            display_name: 'Priority Insured & Expedited Dispatch',
            delivery_estimate: {
              minimum: { unit: 'business_day' as const, value: 4 },
              maximum: { unit: 'business_day' as const, value: 8 },
            },
          },
        },
      ],
      automatic_tax: { enabled: false },
      phone_number_collection: { enabled: true },
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
        cj_variant_vid: cjVariantVid,
      },
    })

    return NextResponse.json({
      url: session.url,
      discountApplied: discountAmount,
      finalPrice,
    })
  } catch (err: any) {
    console.error('[Stripe Session] Error:', err)
    return NextResponse.json({ error: err.message || 'Checkout failed' }, { status: 500 })
  }
}
