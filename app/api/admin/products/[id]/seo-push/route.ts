import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// POST /api/admin/products/[id]/seo-push
// Manually trigger SEO cluster generation for a product
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const product = await prisma.product.findUnique({ where: { id: params.id } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // Check if cluster already exists for this product
  const existing = await (prisma.keywordCluster as any).findFirst({
    where: {
      products: { some: { id: product.id } }
    }
  })

  if (existing) {
    return NextResponse.json({
      message: 'SEO cluster already exists for this product',
      clusterId: existing.id,
      keyword: existing.keyword,
      targetSlug: existing.targetSlug,
    })
  }

  // Generate a basic keyword cluster from product data (no LLM required)
  const niche = product.niche.replace(/-/g, ' ')
  const keyword = `best ${niche} solution`
  const targetSlug = `${product.niche}-guide`
  const relatedKeywords = [
    `${niche} problem fix`,
    `how to solve ${niche}`,
    `${niche} product review`,
    `${niche} for beginners`,
    `affordable ${niche}`,
  ]

  const cluster = await (prisma.keywordCluster as any).create({
    data: {
      keyword,
      searchVolume: Math.floor(Math.random() * 8000) + 1000, // placeholder until real data
      competition: 'medium',
      intent: 'transactional',
      trend: 'rising',
      niche: product.niche,
      relatedKeywords,
      painPoint: `People struggling with ${niche} problems need a reliable, affordable solution.`,
      solutionAngle: `${product.title} directly solves the core ${niche} problem with a targeted approach.`,
      targetSlug,
      targetPageType: 'guide',
      relatedSlugs: [`/products/${product.slug}`, `/bundles`],
      source: 'manual',
      products: { connect: { id: product.id } },
    },
  })

  await prisma.systemLog.create({
    data: {
      level: 'info',
      source: 'admin:seo-push',
      message: `Manually generated SEO cluster for "${product.title}"`,
      meta: JSON.stringify({ productId: product.id, clusterId: cluster.id, keyword }),
    },
  })

  return NextResponse.json({
    success: true,
    clusterId: cluster.id,
    keyword,
    targetSlug,
    message: `SEO cluster created: "${keyword}" → /${targetSlug}`,
  })
}
