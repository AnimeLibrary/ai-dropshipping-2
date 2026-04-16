import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  // Log the subscriber — wire to Klaviyo/Mailchimp by adding an ENV var later
  await prisma.systemLog.create({
    data: {
      level: 'info',
      source: 'email-capture',
      message: `New subscriber: ${email}`,
      meta: JSON.stringify({ email, via: 'homepage-capture' })
    }
  }).catch(() => {}) // non-blocking, don't fail the response

  // TODO: Add Klaviyo/Mailchimp API call here when ready:
  // const KLAVIYO_KEY = process.env.KLAVIYO_API_KEY
  // const MAILCHIMP_KEY = process.env.MAILCHIMP_API_KEY

  return NextResponse.json({ success: true })
}
