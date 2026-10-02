import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/admin'

// PATCH /api/admin/products/[id] — Update product details directly
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const body = await req.json()
    const { title, price, compareAtPrice, niche, shortDescription, longDescription, validationStatus, heroImage } = body

    const numPrice = price !== undefined ? parseFloat(price) : undefined
    const numCompareAt = compareAtPrice !== undefined ? (compareAtPrice ? parseFloat(compareAtPrice) : null) : undefined

    let newDefaultStripePriceId: string | null = null
    if (numPrice !== undefined) {
      // Keep all variants in sync with the new retail price so variants don't show cheap old prices
      await prisma.productVariant.updateMany({
        where: { productId: id },
        data: { retailPrice: numPrice }
      })

      if (process.env.STRIPE_SECRET_KEY) {
        const prodWithVariants = await prisma.product.findUnique({
          where: { id },
          include: { variants: true }
        })

        if (prodWithVariants?.stripeProductId) {
          try {
            const Stripe = (await import('stripe')).default
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' as any })
            const expectedCents = Math.round(numPrice * 100)

            for (const variant of prodWithVariants.variants) {
              const oldPriceId = variant.stripeVariantPriceId
              const newPrice = await stripe.prices.create({
                product: prodWithVariants.stripeProductId,
                unit_amount: expectedCents,
                currency: 'usd',
                nickname: variant.label,
                metadata: {
                  productId: id,
                  variantId: variant.id,
                  vid: variant.vid,
                  label: variant.label,
                }
              })
              if (oldPriceId) {
                await stripe.prices.update(oldPriceId, { active: false }).catch(() => {})
              }
              await prisma.productVariant.update({
                where: { id: variant.id },
                data: { stripeVariantPriceId: newPrice.id }
              })
              if (variant.isDefault || !newDefaultStripePriceId) {
                newDefaultStripePriceId = newPrice.id
              }
            }
          } catch (e: any) {
            console.error('[Admin Price Sync] Failed to sync to Stripe:', e.message)
          }
        }
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(numPrice !== undefined && { price: numPrice }),
        ...(numCompareAt !== undefined && { compareAtPrice: numCompareAt }),
        ...(newDefaultStripePriceId && { stripePriceId: newDefaultStripePriceId }),
        ...(niche !== undefined && { niche }),
        ...(shortDescription !== undefined && { shortDescription }),
        ...(validationStatus !== undefined && { validationStatus }),
        ...(heroImage !== undefined && { heroImage }),
        ...(longDescription !== undefined && { longDescription }),
      },
      include: { variants: true }
    })

    return NextResponse.json({ success: true, product: updated })
  } catch (error: any) {
    console.error('[admin/products PATCH]', error)
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 })
  }
}

// DELETE /api/admin/products/[id] — Permanently delete product from store
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params

    // Clean up dependent child rows first to prevent foreign key errors
    await prisma.orderItem.deleteMany({ where: { productId: id } }).catch(() => {})
    await prisma.productVariant.deleteMany({ where: { productId: id } }).catch(() => {})
    await prisma.supplier.deleteMany({ where: { productId: id } }).catch(() => {})
    await prisma.review.deleteMany({ where: { productId: id } }).catch(() => {})
    await prisma.priceLog.deleteMany({ where: { productId: id } }).catch(() => {})

    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Product deleted' })
  } catch (error: any) {
    console.error('[admin/products DELETE]', error)
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 })
  }
}
