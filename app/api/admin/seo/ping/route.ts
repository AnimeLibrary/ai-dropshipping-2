import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/prisma'
import { IndexingService } from '@/lib/services/indexing-service'

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vexsen.com'

    // Gather high-priority URLs to index
    const [clusters, products] = await Promise.all([
      prisma.keywordCluster.findMany({ select: { targetSlug: true } }),
      prisma.product.findMany({ where: { validationStatus: 'approved' }, select: { slug: true } }),
    ])

    const urlsToIndex = [
      `${siteUrl}/`,
      `${siteUrl}/guides`,
      ...clusters.map(c => `${siteUrl}/guides/${c.targetSlug}`),
      ...products.map(p => `${siteUrl}/products/${p.slug}`),
    ]

    const results = await IndexingService.publishUrls(urlsToIndex)

    return NextResponse.json({
      success: true,
      urlCount: urlsToIndex.length,
      results,
      timestamp: new Date().toISOString(),
      summary: `Dispatched ${urlsToIndex.length} URLs to IndexNow (Bing/Yandex) and Googlebot ping.`
    })
  } catch (error: any) {
    console.error('[SEO Ping API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
