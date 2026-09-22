import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/admin'

// PATCH /api/admin/seo/clusters/[id] — Update an existing cluster
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const body = await req.json()
    const { keyword, searchVolume, intent, targetPageType, targetSlug, niche } = body

    const cleanKeyword = keyword?.trim()

    const updated = await prisma.keywordCluster.update({
      where: { id },
      data: {
        ...(cleanKeyword && { keyword: cleanKeyword }),
        ...(searchVolume !== undefined && { searchVolume: parseInt(searchVolume, 10) || 0 }),
        ...(intent && { intent }),
        ...(targetPageType && { targetPageType }),
        ...(targetSlug && { targetSlug: targetSlug.trim() }),
        ...(niche && { niche }),
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
        hasContent: !!updated.aiContent,
        productCount: updated.products.length,
        createdAt: updated.createdAt.toISOString()
      }
    })
  } catch (error: any) {
    console.error('[admin/seo/clusters PATCH]', error)
    return NextResponse.json({ error: error.message || 'Failed to update SEO cluster' }, { status: 500 })
  }
}

// DELETE /api/admin/seo/clusters/[id] — Delete an SEO cluster
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    await prisma.keywordCluster.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[admin/seo/clusters DELETE]', error)
    return NextResponse.json({ error: error.message || 'Failed to delete SEO cluster' }, { status: 500 })
  }
}
