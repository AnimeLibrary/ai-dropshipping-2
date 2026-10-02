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
    const { variantId, variantPrice, variants: variantUpdates } = body

    // 1. If updating an individual variant
    if (variantId && variantPrice !== undefined) {
      const numVarPrice = parseFloat(variantPrice)
      if (!isNaN(numVarPrice) && numVarPrice > 0) {
        await prisma.productVariant.update({
          where: { id: variantId },
          data: { retailPrice: numVarPrice }
        })

        if (process.env.STRIPE_SECRET_KEY) {
          try {
            const Stripe = (await import('stripe')).default
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' as any })
            const prod = await prisma.product.findUnique({ where: { id }, include: { variants: true } })
            let stripePid = prod?.stripeProductId

            if (!stripePid && prod) {
              const sp = await stripe.products.create({
                name: prod.title,
                metadata: { productId: prod.id, slug: prod.slug }
              })
              stripePid = sp.id
              await prisma.product.update({ where: { id }, data: { stripeProductId: stripePid } })
            }

            if (stripePid) {
              const targetV = prod?.variants.find(v => v.id === variantId)
              if (targetV) {
                const newPrice = await stripe.prices.create({
                  product: stripePid,
                  unit_amount: Math.round(numVarPrice * 100),
                  currency: 'usd',
                  nickname: targetV.label,
                  metadata: { productId: id, variantId: targetV.id, vid: targetV.vid, label: targetV.label }
                })
                if (targetV.stripeVariantPriceId) {
                  await stripe.prices.update(targetV.stripeVariantPriceId, { active: false }).catch(() => {})
                }
                await prisma.productVariant.update({
                  where: { id: variantId },
                  data: { stripeVariantPriceId: newPrice.id }
                })
                if (targetV.isDefault) {
                  newDefaultStripePriceId = newPrice.id
                }
              }
            }
          } catch (e: any) {
            console.error('[Admin Variant Price Sync] Stripe error:', e.message)
          }
        }
      }
    }

    // 2. If updating multiple specific variants
    if (Array.isArray(variantUpdates) && variantUpdates.length > 0) {
      for (const vu of variantUpdates) {
        if (vu.id && vu.retailPrice !== undefined) {
          const vPrice = parseFloat(vu.retailPrice)
          if (!isNaN(vPrice) && vPrice > 0) {
            await prisma.productVariant.update({
              where: { id: vu.id },
              data: { retailPrice: vPrice }
            })
          }
        }
      }
    }

    // 3. If updating product-level retail price
    if (numPrice !== undefined) {
      const prodWithVariants = await prisma.product.findUnique({
        where: { id },
        include: { variants: true }
      })

      if (prodWithVariants) {
        // If variants all had same price or none had custom prices, keep them aligned
        await prisma.productVariant.updateMany({
          where: { productId: id },
          data: { retailPrice: numPrice }
        })

        if (process.env.STRIPE_SECRET_KEY) {
          try {
            const Stripe = (await import('stripe')).default
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' as any })
            let stripePid = prodWithVariants.stripeProductId

            if (!stripePid) {
              const sp = await stripe.products.create({
                name: prodWithVariants.title,
                metadata: { productId: id, slug: prodWithVariants.slug }
              })
              stripePid = sp.id
              await prisma.product.update({ where: { id }, data: { stripeProductId: stripePid } })
            }

            const expectedCents = Math.round(numPrice * 100)

            if (prodWithVariants.variants.length > 0) {
              for (const variant of prodWithVariants.variants) {
                const oldPriceId = variant.stripeVariantPriceId
                const newPrice = await stripe.prices.create({
                  product: stripePid,
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
            } else {
              const singlePrice = await stripe.prices.create({
                product: stripePid,
                unit_amount: expectedCents,
                currency: 'usd',
              })
              newDefaultStripePriceId = singlePrice.id
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
