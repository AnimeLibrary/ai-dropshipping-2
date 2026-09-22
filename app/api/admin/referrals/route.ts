import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/admin'

// POST /api/admin/referrals — Create a new referral/promo code
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { code, ownerName, ownerEmail } = await req.json()
    const cleanCode = (code || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32)
    
    if (!cleanCode) {
      return NextResponse.json({ error: 'Valid referral code is required' }, { status: 400 })
    }

    const existing = await prisma.referral.findUnique({ where: { code: cleanCode } })
    if (existing) {
      return NextResponse.json({ error: `Referral code "${cleanCode}" already exists` }, { status: 409 })
    }

    const referral = await prisma.referral.create({
      data: {
        code: cleanCode,
        ownerId: `admin-${Date.now()}`,
        ownerEmail: ownerEmail?.trim() || 'admin@vexsen.com',
        ownerName: ownerName?.trim() || 'Admin Creator',
        creditsEarned: 0
      },
      include: { uses: true }
    })

    return NextResponse.json({ success: true, referral })
  } catch (error: any) {
    console.error('[admin/referrals POST]', error)
    return NextResponse.json({ error: error.message || 'Failed to create referral code' }, { status: 500 })
  }
}
