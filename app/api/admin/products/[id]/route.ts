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
    const { title, price, compareAtPrice, niche, shortDescription, longDescription, validationStatus, heroImage } = body

    const numPrice = price !== undefined ? parseFloat(price) : undefined
    const numCompareAt = compareAtPrice !== undefined ? (compareAtPrice ? parseFloat(compareAtPrice) : null) : undefined

    if (numPrice !== undefined) {
      // Keep all variants in sync with the new retail price so variants don't show cheap old prices
      await prisma.productVariant.updateMany({
        where: { productId: id },
        data: { retailPrice: numPrice }
      })
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(numPrice !== undefined && { price: numPrice }),
        ...(numCompareAt !== undefined && { compareAtPrice: numCompareAt }),
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
