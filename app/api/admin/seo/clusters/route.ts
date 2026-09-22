import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/admin'

// POST /api/admin/seo/clusters — Create a new SEO Keyword Cluster
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const body = await req.json()
    const {
      keyword,
      searchVolume = 1000,
      intent = 'commercial',
      targetPageType = 'guide',
      niche = 'general',
      targetSlug,
      painPoint = '',
      solutionAngle = '',
    } = body

    if (!keyword?.trim()) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
    }

    const cleanKeyword = keyword.trim()
    const slug = (targetSlug?.trim() || cleanKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))

    const existing = await prisma.keywordCluster.findFirst({
      where: { OR: [{ keyword: cleanKeyword }, { targetSlug: slug }] }
    })
    if (existing) {
      return NextResponse.json({ error: `Cluster with keyword "${cleanKeyword}" or slug "${slug}" already exists` }, { status: 409 })
    }

    const cluster = await prisma.keywordCluster.create({
      data: {
        keyword: cleanKeyword,
        searchVolume: parseInt(searchVolume, 10) || 1000,
        competition: 'Low',
        intent: intent || 'commercial',
        trend: '+12%',
        niche: niche || 'general',
        relatedKeywords: [],
        painPoint: painPoint || `Finding reliable solutions for ${cleanKeyword}`,
        solutionAngle: solutionAngle || `Vexsen vetted essentials for ${cleanKeyword}`,
        targetSlug: slug,
        targetPageType: targetPageType || 'guide',
        relatedSlugs: [],
        source: 'manual',
      },
      include: {
        products: { select: { id: true } }
      }
    })

    return NextResponse.json({
      success: true,
      cluster: {
        id: cluster.id,
        keyword: cluster.keyword,
        searchVolume: cluster.searchVolume,
        intent: cluster.intent,
        targetPageType: cluster.targetPageType,
        hasContent: !!cluster.aiContent,
        productCount: cluster.products.length,
        createdAt: cluster.createdAt.toISOString()
      }
    })
  } catch (error: any) {
    console.error('[admin/seo/clusters POST]', error)
    return NextResponse.json({ error: error.message || 'Failed to create SEO cluster' }, { status: 500 })
  }
}
