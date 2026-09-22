import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/admin'
import { AIClient } from '@/lib/ai/ai-client'

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const body = await req.json().catch(() => ({}))
    let niche = body?.niche?.trim()

    if (!niche) {
      // Pick top niche from approved products
      const topProduct = await prisma.product.findFirst({
        where: { validationStatus: 'approved' },
        orderBy: { trendScore: 'desc' }
      })
      niche = topProduct?.niche || 'ergonomics'
    }

    const ai = new AIClient()
    const prompt = `
      Niche: "${niche}"
      Generate 6 high-intent, transactional and problem-solution SEO keyword clusters for an e-commerce brand selling premium solutions.
      Focus on high buyer pain points where people search to buy a solution immediately.

      For each keyword cluster, provide:
      - keyword (e.g. "lumbar support cushion for office chair")
      - searchVolume (between 1200 and 18000)
      - intent ("transactional" or "problem-solution" or "commercial")
      - targetPageType ("guide" or "solution")
      - painPoint (specific emotional/physical pain)
      - solutionAngle (how an ergonomic/lifestyle product fixes it)
      - relatedKeywords (3 search phrases)
    `

    const schema = `
      {
        "clusters": [
          {
            "keyword": "string",
            "searchVolume": 4500,
            "intent": "transactional",
            "targetPageType": "guide",
            "painPoint": "string",
            "solutionAngle": "string",
            "relatedKeywords": ["phrase1", "phrase2", "phrase3"]
          }
        ]
      }
    `

    let generated: any[] = []
    try {
      const res = await ai.generateStructuredData<{ clusters: any[] }>(prompt, schema)
      if (res.data?.clusters && Array.isArray(res.data.clusters)) {
        generated = res.data.clusters
      }
    } catch (e) {
      console.warn('[SEO Scout] AI call fallback:', e)
    }

    if (generated.length === 0) {
      // Deterministic niche scout keywords
      const nicheSlug = niche.toLowerCase()
      generated = [
        {
          keyword: `best ${niche} solutions for daily pain`,
          searchVolume: 5400,
          intent: 'problem-solution',
          targetPageType: 'guide',
          painPoint: `Chronic fatigue and persistent stiffness caused by poor ${niche} alignment during long days`,
          solutionAngle: `Precision anatomical contouring that unloads nerve pressure and restores circulation`,
          relatedKeywords: [`${niche} relief guide`, `how to fix ${niche} fatigue`, `ergonomic ${niche} setup`]
        },
        {
          keyword: `work from home ${niche} posture setup`,
          searchVolume: 3800,
          intent: 'transactional',
          targetPageType: 'guide',
          painPoint: `Slouching and shoulder rounding caused by unsupportive standard furniture`,
          solutionAngle: `Active spine alignment and decompressive support designed for 8+ hour work sessions`,
          relatedKeywords: [`wfh ${niche} support`, `desk posture fixer`, `ergonomic work station`]
        },
        {
          keyword: `${niche} comparison guide for buyers`,
          searchVolume: 2900,
          intent: 'commercial',
          targetPageType: 'guide',
          painPoint: `Wasting money on cheap knockoffs that go flat after 2 weeks of use`,
          solutionAngle: `High-density memory resilience with breathable cooling covers tested for durability`,
          relatedKeywords: [`top rated ${niche} products`, `best ${niche} under 50`, `quality ${niche} reviews`]
        }
      ]
    }

    const createdList = []
    for (const c of generated) {
      const targetSlug = c.keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const cluster = await prisma.keywordCluster.upsert({
        where: { targetSlug },
        update: {
          searchVolume: c.searchVolume,
          intent: c.intent,
          targetPageType: c.targetPageType,
          painPoint: c.painPoint,
          solutionAngle: c.solutionAngle,
          relatedKeywords: c.relatedKeywords || [],
        },
        create: {
          keyword: c.keyword,
          searchVolume: c.searchVolume,
          competition: 'low',
          intent: c.intent,
          trend: 'rising',
          niche,
          painPoint: c.painPoint,
          solutionAngle: c.solutionAngle,
          relatedKeywords: c.relatedKeywords || [],
          targetSlug,
          targetPageType: c.targetPageType,
          relatedSlugs: [],
          source: 'ai_scout'
        },
        include: { products: { select: { id: true } } }
      })

      createdList.push({
        id: cluster.id,
        keyword: cluster.keyword,
        searchVolume: cluster.searchVolume,
        intent: cluster.intent,
        targetPageType: cluster.targetPageType,
        targetSlug: cluster.targetSlug,
        hasContent: !!cluster.aiContent,
        productCount: cluster.products.length,
        createdAt: cluster.createdAt.toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      niche,
      count: createdList.length,
      clusters: createdList
    })
  } catch (err: any) {
    console.error('[SEO Scout] Error:', err)
    return NextResponse.json({ error: err.message || 'Failed to scout niche' }, { status: 500 })
  }
}
