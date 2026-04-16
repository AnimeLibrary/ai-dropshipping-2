import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/products?status=all&search=xxx
// Used by the admin dashboard "All Products" database tab
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''

    const whereClause: any = {}
    if (status !== 'all') whereClause.validationStatus = status
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { niche: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        variants: { orderBy: [{ isDefault: 'desc' }, { cjStock: 'desc' }] },
        suppliers: true,
        reviews: { select: { rating: true } },
        _count: { select: { orderItems: true } },
      }
    })

    const serialized = products.map(p => ({
      ...p,
      price: Number(p.price),
      supplierPrice: Number(p.supplierPrice),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      cjLastSyncedAt: p.cjLastSyncedAt ? p.cjLastSyncedAt.toISOString() : null,
      variants: p.variants.map(v => ({
        ...v,
        retailPrice: Number(v.retailPrice),
        supplierPrice: Number(v.supplierPrice),
      })),
      suppliers: p.suppliers.map(s => ({
        ...s,
        price: Number(s.price),
      })),
    }))

    return NextResponse.json({ products: serialized })
  } catch (error: any) {
    console.error('[admin/products GET]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
