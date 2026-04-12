// POST /api/referral/generate — creates or retrieves a user's referral code
import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

function generateCode(name: string): string {
  const prefix = 'VEX'
  // Take first 3 chars of name (uppercased, letters only) + 4 random alphanumeric
  const namePart = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3).padEnd(3, 'X')
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${namePart}${rand}`
}

export async function POST() {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const email = user.emailAddresses[0]?.emailAddress || ''
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Vexsen Member'

    // Check if they already have a code
    const existing = await prisma.referral.findFirst({ where: { ownerId: userId } })
    if (existing) return NextResponse.json({ code: existing.code, referral: existing })

    // Generate a unique code
    let code = generateCode(name)
    let attempts = 0
    while (attempts < 10) {
      const taken = await prisma.referral.findUnique({ where: { code } })
      if (!taken) break
      code = generateCode(name)
      attempts++
    }

    const referral = await prisma.referral.create({
      data: { code, ownerId: userId, ownerEmail: email, ownerName: name }
    })

    return NextResponse.json({ code: referral.code, referral })
  } catch (err) {
    console.error('[referral/generate]', err)
    return NextResponse.json({ error: 'Failed to generate referral code' }, { status: 500 })
  }
}
