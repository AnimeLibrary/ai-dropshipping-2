// GET /api/referral/validate/[code] — validate a promo code and return discount info
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code?.toUpperCase().trim()
  if (!code) return NextResponse.json({ valid: false, error: 'No code provided' })

  const referral = await prisma.referral.findUnique({
    where: { code },
    include: { _count: { select: { uses: true } } }
  })

  if (!referral) {
    return NextResponse.json({ valid: false, error: 'Invalid promo code' })
  }

  return NextResponse.json({
    valid: true,
    code: referral.code,
    ownerName: referral.ownerName,
    discountPercent: 15,
    totalUses: referral._count.uses,
  })
}
