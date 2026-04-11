import { prisma } from '@/lib/db/prisma'
import AdminDashboardClient from '@/components/admin/AdminDashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [rawProducts, rawOrders] = await Promise.all([
    prisma.product.findMany({
      select: { id:true, title:true, niche:true, trendScore:true, price:true, supplierPrice:true, validationStatus:true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.order.findMany({
      select: {
        id:true, customerName:true, customerEmail:true, status:true,
        totalAmount:true, trackingNumber:true, createdAt:true,
        items: {
          select: { productId:true, supplierUrl:true, quantity:true, priceAtSale:true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ])

  const pending  = rawProducts.filter(p => p.validationStatus === 'pending')
  const approved = rawProducts.filter(p => p.validationStatus === 'approved')
  const archived = rawProducts
    .filter(p => p.validationStatus === 'archived')
    .map(p => ({ id: p.id, title: p.title, reason: 'Automated margin/stock check failed.' }))

  const liveOrders = rawOrders.map(o => ({
    ...o,
    trackingNumber: o.trackingNumber ?? undefined,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map(item => ({
      productId: item.productId,
      supplierUrl: item.supplierUrl ?? null,
      quantity: item.quantity,
      priceAtSale: item.priceAtSale,
    }))
  }))

  return (
    <AdminDashboardClient
      pendingProducts={pending}
      approvedProducts={approved}
      archivedProducts={archived}
      liveOrders={liveOrders}
    />
  )
}
