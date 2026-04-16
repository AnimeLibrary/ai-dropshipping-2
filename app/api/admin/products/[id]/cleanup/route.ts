import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { enrichProductWithAI } from '@/lib/ai/agent-tools'

const INTERNAL_PATTERNS = [
  'guardrail', 'saturation', 'APPROVE', 'REVIEW', 'TikTok UGC',
  'fulfillment', 'Niche saturation', 'profit floor', 'markup rule',
  'passes3x', 'marginRating', 'aiReasoning', 'productId',
]

function isInternalData(text: string | null): boolean {
  if (!text) return false
  return INTERNAL_PATTERNS.some(p => text.toLowerCase().includes(p.toLowerCase()))
}

/**
 * POST /api/admin/products/[id]/cleanup
 * Clears any internal analysis data that leaked into customer-facing fields,
 * then re-runs AI enrichment to generate clean storefront copy.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({ where: { id: params.id } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const updates: Record<string, any> = {}
    const cleaned: string[] = []

    // Clear shortDescription if it contains internal analysis text  
    if (isInternalData(product.shortDescription)) {
      updates.shortDescription = null
      cleaned.push('shortDescription (contained internal analysis data)')
    }

    // Clear longDescription if it looks like the raw analysis report JSON
    if (product.longDescription && isInternalData(product.longDescription)) {
      updates.longDescription = null
      cleaned.push('longDescription (contained internal analysis report)')
    }

    if (Object.keys(updates).length > 0) {
      await prisma.product.update({ where: { id: params.id }, data: updates })
    }

    // Delete ANY seeded reviews that don't match this product's niche
    // (Blunt but correct: wipe all pending/seeded reviews, leave user-submitted approved ones)
    const deletedReviews = await prisma.review.deleteMany({
      where: { productId: params.id, status: 'pending' }
    })
    if (deletedReviews.count > 0) {
      cleaned.push(`${deletedReviews.count} pending/seeded review(s) removed`)
    }

    // Re-run enrichment to generate fresh, clean marketing copy
    const enrichResult = await enrichProductWithAI(params.id, product.title, product.niche)

    await prisma.systemLog.create({
      data: {
        level: 'info',
        source: 'admin:cleanup',
        message: `Cleaned and re-enriched "${product.title}"`,
        meta: JSON.stringify({ productId: params.id, cleaned, enrichSuccess: enrichResult.success }),
      }
    })

    return NextResponse.json({
      success: true,
      message: `"${product.title}" cleaned and re-enriched.`,
      cleaned,
      enriched: enrichResult.success,
      newDescription: enrichResult.data?.shortDescription || null,
    })
  } catch (err: any) {
    console.error('[admin/cleanup]', err)
    return NextResponse.json({ error: err.message || 'Cleanup failed' }, { status: 500 })
  }
}
