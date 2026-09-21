import { NextRequest, NextResponse } from 'next/server'
import { cj } from '@/lib/services/cj-service'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/prisma'

// POST /api/admin/cj/import
// Body: { pid: string, niche?: string, markupFactor?: number }
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { pid, niche = 'general', markupFactor = 2.5 } = await req.json()

    if (!pid) {
      return NextResponse.json({ error: 'Missing CJ product ID (pid)' }, { status: 400 })
    }

    if (!cj.isConfigured()) {
      return NextResponse.json(
        { error: 'CJ Dropshipping credentials missing in .env' },
        { status: 500 }
      )
    }

    const product = await cj.importProduct(pid, niche, markupFactor)

    await prisma.systemLog.create({
      data: {
        level: 'info',
        source: 'admin:cj-import',
        message: `Imported CJ product "${product.title}" (${pid}) into pipeline.`,
        meta: JSON.stringify({ productId: product.id, pid, variants: product.variants?.length || 0 })
      }
    })

    return NextResponse.json({ success: true, product })
  } catch (error: any) {
    console.error('[CJ Import Error]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import product from CJ Dropshipping' },
      { status: 500 }
    )
  }
}
