import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/admin'
import { AIClient } from '@/lib/ai/ai-client'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const cluster = await prisma.keywordCluster.findUnique({
      where: { id },
      include: { products: true }
    })

    if (!cluster) {
      return NextResponse.json({ error: 'Cluster not found' }, { status: 404 })
    }

    // Try AI generation, fallback to smart template
    const ai = new AIClient()
    const prompt = `
      Keyword: "${cluster.keyword}"
      Niche: "${cluster.niche}"
      Intent: "${cluster.intent}"
      Pain point: "${cluster.painPoint || 'daily ergonomic fatigue, posture collapse, and muscle strain'}"
      Solution angle: "${cluster.solutionAngle || 'precision physical ergonomic alignment and decompression'}"

      Generate a comprehensive, high-ranking SEO content payload for this keyword guide.
      Requirements:
      - empathyIntro: 2-3 sentences genuinely validating the customer's frustration and pain.
      - deepProblemAnalysis: 1-2 paragraphs detailing the physiological or physical reason standard fixes fail and why this problem persists.
      - scienceBehindSolution: 1-2 paragraphs explaining the mechanical/ergonomic science behind why the solution works.
      - faq: exactly 3 high-intent Q&As addressing common doubts, results timeline, and usage.
    `

    const schema = `
      {
        "empathyIntro": "string",
        "deepProblemAnalysis": "string",
        "scienceBehindSolution": "string",
        "faq": [
          { "question": "string", "answer": "string" },
          { "question": "string", "answer": "string" },
          { "question": "string", "answer": "string" }
        ]
      }
    `

    let generatedContent: any = null
    try {
      const aiRes = await ai.generateStructuredData<any>(prompt, schema)
      if (aiRes.data && aiRes.data.empathyIntro) {
        generatedContent = aiRes.data
      }
    } catch (e) {
      console.warn('[SEO Generator] AI client fallback triggered:', e)
    }

    if (!generatedContent) {
      // Deterministic high-quality fallback
      generatedContent = {
        empathyIntro: `If you are constantly dealing with ${cluster.keyword.toLowerCase()}, you know how quickly it drains your energy and focus throughout the day. Standard mass-market fixes rarely address the actual root cause, leaving you frustrated and back at square one.`,
        deepProblemAnalysis: `Most conventional solutions attempt to mask the symptoms rather than eliminating the underlying biomechanical stress. When repetitive strain or posture misalignment remains uncorrected, the body compensates by overworking secondary muscle groups, compounding inflammation and chronic fatigue.`,
        scienceBehindSolution: `By introducing targeted ergonomic alignment and continuous decompressive support, this approach realigns load distribution across your spine and joints. Active contouring relieves pinpoint pressure spots, restoring natural blood flow and neuromuscular balance within minutes of use.`,
        faq: [
          {
            question: `How quickly does this help with ${cluster.keyword}?`,
            answer: `Most users report noticeable relief within the first 15 to 30 minutes of consistent use, with long-term posture and muscular benefits compounding over 14 days.`
          },
          {
            question: `Is this suitable for everyday home and office use?`,
            answer: `Yes. Engineered with medical-grade resilient materials, it is designed for continuous 8+ hour daily sessions without losing structural integrity.`
          },
          {
            question: `What is the warranty and return policy?`,
            answer: `Every order includes a 30-day risk-free trial and full tracked delivery. If you do not experience measurable improvement, return it for a complete refund.`
          }
        ]
      }
    }

    // Also auto-connect relevant products if none are connected yet
    if (cluster.products.length === 0) {
      const candidateProducts = await prisma.product.findMany({
        where: { validationStatus: 'approved' },
        take: 3
      })
      if (candidateProducts.length > 0) {
        await prisma.keywordCluster.update({
          where: { id },
          data: {
            products: {
              connect: candidateProducts.map(p => ({ id: p.id }))
            }
          }
        })
      }
    }

    const updated = await prisma.keywordCluster.update({
      where: { id },
      data: {
        aiContent: generatedContent,
      },
      include: {
        products: { select: { id: true } }
      }
    })

    return NextResponse.json({
      success: true,
      cluster: {
        id: updated.id,
        keyword: updated.keyword,
        searchVolume: updated.searchVolume,
        intent: updated.intent,
        targetPageType: updated.targetPageType,
        targetSlug: updated.targetSlug,
        hasContent: true,
        productCount: updated.products.length,
        createdAt: updated.createdAt.toISOString()
      }
    })
  } catch (err: any) {
    console.error('[Generate Cluster Content] Error:', err)
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 })
  }
}
