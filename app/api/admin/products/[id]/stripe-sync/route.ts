import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import Stripe from 'stripe'

// POST /api/admin/products/[id]/stripe-sync
// Manual fallback: push an approved product to Stripe and write back the IDs
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY not set' }, { status: 500 })
  }

  const product = await prisma.product.findUnique({ 
    where: { id: params.id },
    include: { variants: true }
  })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  if (product.stripePriceId || product.stripeProductId) {
    return NextResponse.json({
      message: 'Already synced to Stripe',
      stripePriceId: product.stripePriceId,
      stripeProductId: product.stripeProductId,
    })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

  // Parse gallery images for Stripe (max 8)
  let imageUrls: string[] = []
  try {
    if (product.heroImage?.startsWith('[')) {
      const parsed = JSON.parse(product.heroImage)
      imageUrls = Array.isArray(parsed) ? parsed.slice(0, 8) : []
    } else if (product.heroImage) {
      imageUrls = [product.heroImage]
    }
  } catch {}

  const stripeProd = await stripe.products.create({
    name: product.title,
    description: product.shortDescription || `A targeted solution for ${product.niche.replace(/-/g, ' ')}`,
    images: imageUrls,
    metadata: {
      productId: product.id,
      slug: product.slug,
      niche: product.niche,
      cjProductId: product.cjProductId || '',
    },
  })

  let defaultStripePriceId = null

  if (product.variants.length > 0) {
    for (const variant of product.variants) {
      try {
        const variantPrice = await stripe.prices.create({
          product: stripeProd.id,
          unit_amount: Math.round(variant.retailPrice * 100),
          currency: 'usd',
          nickname: variant.label,
          metadata: {
            variantId: variant.id,
            vid: variant.vid,
            label: variant.label,
            color: variant.color || '',
            size: variant.size || '',
          }
        })
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { stripeVariantPriceId: variantPrice.id }
        })
        if (variant.isDefault) {
          defaultStripePriceId = variantPrice.id
        }
      } catch (e: any) {
        console.error(`[Stripe variant failed] ${variant.label}:`, e.message)
      }
    }
    if (!defaultStripePriceId && product.variants[0]) {
      const firstVariant = await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } })
      defaultStripePriceId = firstVariant?.stripeVariantPriceId || null
    }
  } else {
    // Fallback: No variants
    const singlePrice = await stripe.prices.create({
      product: stripeProd.id,
      unit_amount: Math.round(product.price * 100),
      currency: 'usd',
    })
    defaultStripePriceId = singlePrice.id
  }

  await prisma.product.update({
    where: { id: product.id },
    data: {
      stripeProductId: stripeProd.id,
      stripePriceId: defaultStripePriceId,
    },
  })

  await prisma.systemLog.create({
    data: {
      level: 'info',
      source: 'admin:stripe-sync',
      message: `Manually synced "${product.title}" to Stripe`,
      meta: JSON.stringify({ productId: product.id, stripeProductId: stripeProd.id, stripePriceId: stripePrice.id }),
    },
  })

  return NextResponse.json({
    success: true,
    stripeProductId: stripeProd.id,
    stripePriceId: stripePrice.id,
    dashboardUrl: `https://dashboard.stripe.com/products/${stripeProd.id}`,
  })
}
