import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vexsen.com'
    const sitemapUrl = `${siteUrl}/sitemap.xml`

    const targets = [
      { name: 'Google', url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
      { name: 'Bing', url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` }
    ]

    const results = await Promise.allSettled(
      targets.map(async (target) => {
        try {
          const res = await fetch(target.url, { method: 'GET', signal: AbortSignal.timeout(5000) })
          return { name: target.name, status: res.status, ok: res.ok }
        } catch (e: any) {
          return { name: target.name, status: 0, ok: false, error: e.message }
        }
      })
    )

    const clusterCount = await prisma.keywordCluster.count()
    const productCount = await prisma.product.count({ where: { validationStatus: 'approved' } })

    try {
      await prisma.systemLog.create({
        data: {
          level: 'info',
          source: 'SEO_PING',
          message: `Sitemap submitted to Google & Bing for ${sitemapUrl} (${clusterCount} clusters, ${productCount} live products)`,
        }
      })
    } catch {}

    return NextResponse.json({
      success: true,
      sitemapUrl,
      results,
      timestamp: new Date().toISOString(),
      summary: `Pings dispatched to Google and Bing for ${clusterCount} SEO clusters and ${productCount} products.`
    })
  } catch (error: any) {
    console.error('[SEO Ping] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
