import { prisma } from '@/lib/db/prisma'
import AdminDashboardClient from '@/components/admin/AdminDashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [rawProducts, rawOrders, rawReferrals, rawBaseReviews, rawSeoClusters] = await Promise.all([
    prisma.product.findMany({
      select: { id:true, title:true, niche:true, trendScore:true, price:true, supplierPrice:true, validationStatus:true, cjVariantId:true, cjProductId:true },
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
    }),
    prisma.referral.findMany({
      include: {
        uses: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.review.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      select: { id:true, productSlug:true, rating:true, title:true, body:true, authorName:true, createdAt:true }
    }),
    prisma.keywordCluster.findMany({
      orderBy: { searchVolume: 'desc' },
      select: { id:true, keyword:true, searchVolume:true, intent:true, targetPageType:true, aiContent:true, products: { select: { id:true } }, createdAt:true }
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
      cjVariantId: item.cjVariantId ?? null,
      quantity: item.quantity,
      priceAtSale: item.priceAtSale,
    }))
  }))

  const pendingReviews = rawBaseReviews.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString()
  }))

  const seoClusters = rawSeoClusters.map(c => ({
    ...c,
    hasContent: !!c.aiContent,
    productCount: c.products.length,
    createdAt: c.createdAt.toISOString()
  }))

  return (
    <AdminDashboardClient
      pendingProducts={pending}
      approvedProducts={approved}
      archivedProducts={archived}
      liveOrders={liveOrders}
      referrals={rawReferrals as any}
      pendingReviews={pendingReviews}
      seoClusters={seoClusters as any}
    />
  )
}
