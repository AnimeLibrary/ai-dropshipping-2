import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { action } = await req.json()

    if (!id || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    if (action === 'reject') {
      await prisma.review.delete({ where: { id } })
      return NextResponse.json({ success: true, message: 'Review rejected & deleted.' })
    }

    await prisma.review.update({
      where: { id },
      data: { status: 'approved' }
    })

    return NextResponse.json({ success: true, message: 'Review approved & live.' })
  } catch (err) {
    console.error('[admin/reviews/status]', err)
    return NextResponse.json({ error: 'Failed to update review status' }, { status: 500 })
  }
}
