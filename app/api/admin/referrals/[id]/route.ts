import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/admin'

// PATCH /api/admin/referrals/[id] — Update referral code
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const { code, ownerName, ownerEmail, creditsEarned } = await req.json()

    const cleanCode = code ? code.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32) : undefined

    if (cleanCode) {
      const conflict = await prisma.referral.findFirst({
        where: { code: cleanCode, NOT: { id } }
      })
      if (conflict) {
        return NextResponse.json({ error: `Code "${cleanCode}" is already taken` }, { status: 409 })
      }
    }

    const updated = await prisma.referral.update({
      where: { id },
      data: {
        ...(cleanCode && { code: cleanCode }),
        ...(ownerName !== undefined && { ownerName: ownerName.trim() }),
        ...(ownerEmail !== undefined && { ownerEmail: ownerEmail.trim() }),
        ...(creditsEarned !== undefined && { creditsEarned: parseFloat(creditsEarned) || 0 })
      },
      include: { uses: true }
    })

    return NextResponse.json({ success: true, referral: updated })
  } catch (error: any) {
    console.error('[admin/referrals PATCH]', error)
    return NextResponse.json({ error: error.message || 'Failed to update referral' }, { status: 500 })
  }
}

// DELETE /api/admin/referrals/[id] — Delete referral code
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    await prisma.referral.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[admin/referrals DELETE]', error)
    return NextResponse.json({ error: error.message || 'Failed to delete referral' }, { status: 500 })
  }
}
