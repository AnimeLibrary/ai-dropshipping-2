import { NextRequest, NextResponse } from 'next/server'
import { cj } from '@/lib/services/cj-service'
import { requireAdmin } from '@/lib/auth/admin'

// GET /api/admin/cj/search?keyword=posture&pageSize=12
export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { searchParams } = new URL(req.url)
    const keyword = searchParams.get('keyword') || 'bestseller'
    const pageSize = parseInt(searchParams.get('pageSize') || '12', 10)

    if (!cj.isConfigured()) {
      return NextResponse.json(
        { error: 'CJ Dropshipping credentials missing in .env (CJ_EMAIL / CJ_API_KEY)' },
        { status: 500 }
      )
    }

    const products = await cj.searchBestSellers(keyword, pageSize)
    return NextResponse.json({ success: true, products })
  } catch (error: any) {
    console.error('[CJ Search Error]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products from CJ Dropshipping' },
      { status: 500 }
    )
  }
}
