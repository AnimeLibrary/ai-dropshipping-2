import { prisma } from '@/lib/db/prisma'
import AdminDashboardClient from '@/components/admin/AdminDashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [rawProducts, rawOrders, rawReferrals, rawBaseReviews, rawSeoClusters] = await Promise.all([
    prisma.product.findMany({
      select: {
        id:true, title:true, slug:true, niche:true, trendScore:true,
        price:true, supplierPrice:true, compareAtPrice:true, validationStatus:true,
        stripePriceId:true, stripeProductId:true,
        cjVariantId:true, cjProductId:true,
        cjSalesRank:true, cjSupplierScore:true, cjLastSyncedAt:true,
        heroImage:true, shortDescription:true, source:true, category:true,
        createdAt:true,
        variants: {
          select: { id:true, vid:true, label:true, color:true, size:true, retailPrice:true, cjStock:true, image:true, isDefault:true, stripeVariantPriceId:true },
          orderBy: [{ isDefault: 'desc' }, { cjStock: 'desc' }]
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.order.findMany({
      select: {
        id:true, customerName:true, customerEmail:true, status:true,
        totalAmount:true, trackingNumber:true, createdAt:true,
        items: {
          select: { productId:true, supplierUrl:true, quantity:true, priceAtSale:true, cjVariantId:true }
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

  const serializeProduct = (p: typeof rawProducts[0]) => ({
    ...p,
    compareAtPrice: p.compareAtPrice ?? undefined,
    stripePriceId: p.stripePriceId ?? null,
    stripeProductId: p.stripeProductId ?? null,
    cjVariantId: p.cjVariantId ?? null,
    cjProductId: p.cjProductId ?? null,
    cjSalesRank: p.cjSalesRank ?? null,
    cjSupplierScore: p.cjSupplierScore ?? null,
    cjLastSyncedAt: p.cjLastSyncedAt ? p.cjLastSyncedAt.toISOString() : null,
    heroImage: p.heroImage ?? null,
    shortDescription: p.shortDescription ?? null,
    source: p.source ?? null,
    category: p.category ?? null,
    createdAt: p.createdAt.toISOString(),
    variants: p.variants.map(v => ({
      ...v,
      color: v.color ?? null,
      size: v.size ?? null,
      image: v.image ?? null,
      stripeVariantPriceId: v.stripeVariantPriceId ?? null,
    })),
  })

  const pending  = rawProducts.filter(p => p.validationStatus === 'pending').map(serializeProduct)
  const approved = rawProducts.filter(p => p.validationStatus === 'approved').map(serializeProduct)
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
