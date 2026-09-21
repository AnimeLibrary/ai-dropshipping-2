import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/admin'

/**
 * GET /api/admin/orders/[id]/fulfill
 * Returns the AutoDS deep-link URL for manual order placement.
 * AutoDS manual order URL format:
 *   https://platform.autods.com/orders/manual-orders?url=<supplierUrl>&quantity=<qty>
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true }
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Build AutoDS manual order URL for the first supplier item
  // (AutoDS manual order page accepts a product URL as a query param)
  const firstItem = order.items[0]
  const supplierUrl = firstItem?.supplierUrl || ''

  const autoDSUrl = supplierUrl
    ? `https://platform.autods.com/orders/manual-orders?productUrl=${encodeURIComponent(supplierUrl)}&qty=${firstItem.quantity}`
    : 'https://platform.autods.com/orders/manual-orders'

  return NextResponse.json({
    orderId: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    totalAmount: order.totalAmount,
    status: order.status,
    autoDSUrl,
    items: order.items.map(item => ({
      productId: item.productId,
      supplierUrl: item.supplierUrl,
      quantity: item.quantity,
      priceAtSale: item.priceAtSale
    }))
  })
}

/**
 * PATCH /api/admin/orders/[id]/fulfill
 * Updates order status (e.g., mark as 'fulfilled' or 'shipped')
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await req.json()
  const { status, trackingNumber } = body

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: status || 'shipped',
      trackingNumber: trackingNumber || null,
      fulfillmentLog: `Manually marked as ${status || 'shipped'} at ${new Date().toISOString()}`
    }
  })

  await prisma.systemLog.create({
    data: {
      level: 'info',
      source: 'fulfillment:manual',
      message: `Order #${id} manually updated to status: ${status || 'shipped'}`,
    }
  })

  return NextResponse.json({ success: true, order: updated })
}
