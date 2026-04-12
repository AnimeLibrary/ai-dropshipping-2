import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { enrichProductWithAI } from '@/lib/ai/agent-tools'

/**
 * POST /api/admin/products/[id]/enrich
 *
 * Triggers full AI enrichment for a product:
 * 1. Generates pain-point-first shortDescription via local LLM / OpenAI
 * 2. Finds best product images via Serper image search
 * 3. Updates the DB record in place
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const result = await enrichProductWithAI(id, product.title, product.niche)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    productId: id,
    title: product.title,
    updates: {
      shortDescription: result.data.shortDescription,
      heroImage: result.data.heroImage,
      hook: result.data.hook,
    },
    serperUsed: result.data.serperUsed,
    message: `✅ "${product.title}" enriched with AI copy${result.data.heroImage ? ' and new product image' : ''}.`
  })
}
