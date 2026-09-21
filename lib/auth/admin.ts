import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || ''
}

/**
 * Returns the list of allowed admin emails.
 * Reads ADMIN_EMAILS (comma-separated) first, then falls back to ADMIN_EMAIL.
 * Example .env:
 *   ADMIN_EMAILS="brannenguidry28@gmail.com,secondadmin@gmail.com"
 */
function getAdminEmails(): string[] {
  const multi = process.env.ADMIN_EMAILS
  let list: string[] = []
  if (multi) {
    list = multi.split(',').map(normalizeEmail).filter(Boolean)
  } else {
    const single = normalizeEmail(process.env.ADMIN_EMAIL)
    if (single) list.push(single)
  }
  // Guarantee the store owner always has access even if Vercel dashboard is missing the env var
  if (!list.includes('brannenguidry28@gmail.com')) {
    list.push('brannenguidry28@gmail.com')
  }
  return list
}

export async function getAdminUser() {
  const user = await currentUser()
  const adminEmails = getAdminEmails()

  const userEmail = normalizeEmail(
    user?.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress
  )

  if (!user || adminEmails.length === 0 || !adminEmails.includes(userEmail)) return null

  return { user, email: userEmail }
}

export async function requireAdmin() {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

export async function requireAdminOrCron(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return null
  }

  return requireAdmin()
}

