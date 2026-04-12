import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import Stripe from 'stripe'

type Action = 'approve' | 'queue' | 'reject'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const body = await req.json() as { action: Action; notes?: string; cjVariantId?: string; cjProductId?: string }
  const { action, notes, cjVariantId, cjProductId } = body

  if (!['approve', 'queue', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const statusMap: Record<Action, string> = {
    approve: 'approved',
    queue: 'queuedForPublish',
    reject: 'archived',
  }

  if (action === 'queue' && product.validationStatus !== 'approved') {
    return NextResponse.json(
      { error: 'Product must be approved before queuing' },
      { status: 400 }
    )
  }

  let stripeProductId = null
  let stripePriceId = null

  if (action === 'approve' && !product.stripePriceId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
      const stripeProd = await stripe.products.create({
        name: product.title,
        description: product.shortDescription || `A targeted solution for ${product.niche.replace(/-/g, ' ')}`,
        images: product.heroImage ? [product.heroImage] : [],
        metadata: { productId: product.id }
      })
      const stripePrice = await stripe.prices.create({
        product: stripeProd.id,
        unit_amount: Math.round(product.price * 100),
        currency: 'usd',
      })
      stripeProductId = stripeProd.id
      stripePriceId = stripePrice.id
    } catch (e: any) {
      console.error('[Stripe Sync Error]', e.message)
    }
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { 
      validationStatus: statusMap[action],
      ...(stripeProductId && { stripeProductId }),
      ...(stripePriceId && { stripePriceId }),
      ...(cjVariantId && { cjVariantId }),
      ...(cjProductId && { cjProductId })
    }
  })

  // Log to SystemLog
  await prisma.systemLog.create({
    data: {
      level: action === 'reject' ? 'warn' : 'info',
      source: 'admin:product-status',
      message: `Product "${updated.title}" → ${statusMap[action]}`,
      meta: JSON.stringify({ productId: id, action, notes })
    }
  })

  return NextResponse.json({
    success: true,
    product: {
      id: updated.id,
      title: updated.title,
      validationStatus: updated.validationStatus,
    }
  })
}
