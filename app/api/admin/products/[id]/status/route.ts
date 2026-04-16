import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import Stripe from 'stripe'

type Action = 'approve' | 'reject'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const body = await req.json() as { action: Action; notes?: string }
  const { action, notes } = body

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true }
  })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // ── REJECT ───────────────────────────────────────────────────
  if (action === 'reject') {
    const updated = await prisma.product.update({
      where: { id },
      data: { validationStatus: 'archived' }
    })
    await prisma.systemLog.create({
      data: {
        level: 'warn',
        source: 'admin:product-status',
        message: `Product "${updated.title}" → archived`,
        meta: JSON.stringify({ productId: id, action, notes })
      }
    })
    return NextResponse.json({ success: true, product: { id: updated.id, title: updated.title, validationStatus: 'archived' } })
  }

  // ── APPROVE ──────────────────────────────────────────────────
  let stripeProductId = product.stripeProductId
  let defaultStripePriceId = product.stripePriceId

  if (!stripeProductId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

      // Parse gallery images safely
      let imageUrls: string[] = []
      try {
        if (product.heroImage?.startsWith('[')) {
          imageUrls = JSON.parse(product.heroImage).slice(0, 8)
        } else if (product.heroImage) {
          imageUrls = [product.heroImage]
        }
      } catch {}

      // 1. Create ONE Stripe Product
      const stripeProd = await stripe.products.create({
        name: product.title,
        description: product.shortDescription || `A solution for ${product.niche.replace(/-/g, ' ')}`,
        images: imageUrls,
        metadata: { productId: product.id, cjProductId: product.cjProductId || '', niche: product.niche }
      })
      stripeProductId = stripeProd.id

      // 2. If product has variants → create one Stripe Price per variant
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
            // Write Stripe price ID back to the variant row
            await prisma.productVariant.update({
              where: { id: variant.id },
              data: { stripeVariantPriceId: variantPrice.id }
            })
            // Use the default variant's price as the canonical product price
            if (variant.isDefault) {
              defaultStripePriceId = variantPrice.id
            }
          } catch (e: any) {
            console.error(`[Stripe variant price failed] ${variant.label}:`, e.message)
          }
        }
        // Fallback: if no default was flagged, use the first variant
        if (!defaultStripePriceId && product.variants[0]) {
          const firstVariant = await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } })
          defaultStripePriceId = firstVariant?.stripeVariantPriceId || null
        }
      } else {
        // No variants → create a single price on the product
        const singlePrice = await stripe.prices.create({
          product: stripeProd.id,
          unit_amount: Math.round(product.price * 100),
          currency: 'usd',
        })
        defaultStripePriceId = singlePrice.id
      }
    } catch (e: any) {
      console.error('[Stripe Sync Error]', e.message)
      await prisma.systemLog.create({
        data: {
          level: 'error',
          source: 'admin:product-status',
          message: `Stripe sync failed for "${product.title}": ${e.message}`,
          meta: JSON.stringify({ productId: id })
        }
      })
    }
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      validationStatus: 'approved',
      ...(stripeProductId && { stripeProductId }),
      ...(defaultStripePriceId && { stripePriceId: defaultStripePriceId }),
    },
    include: { variants: true }
  })

  await prisma.systemLog.create({
    data: {
      level: 'info',
      source: 'admin:product-status',
      message: `Product "${updated.title}" → approved. Stripe: ${stripeProductId ? '✅ synced' : '⚠️ skipped'}. Variants: ${updated.variants.length}`,
      meta: JSON.stringify({ productId: id, action, notes, stripeProductId, variantCount: updated.variants.length })
    }
  })

  return NextResponse.json({
    success: true,
    product: {
      id: updated.id,
      title: updated.title,
      validationStatus: updated.validationStatus,
      stripeProductId: updated.stripeProductId,
      stripePriceId: updated.stripePriceId,
      variantCount: updated.variants.length,
      stripeSynced: !!stripeProductId
    }
  })
}
