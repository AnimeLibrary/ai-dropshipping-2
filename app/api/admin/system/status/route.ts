import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/admin/system/status
 * Returns real status of every required env var and service.
 * No fake toggles. Every check is a real HTTP ping or null check.
 */
export async function GET() {
  const checks = await Promise.allSettled([
    pingLMStudio(),
    pingStripe(),
    pingDatabase(),
  ])

  const [lmStudio, stripe, database] = checks

  const envKeys = {
    STRIPE_SECRET_KEY:      !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET:  !!process.env.STRIPE_WEBHOOK_SECRET,
    DATABASE_URL:           !!process.env.DATABASE_URL,
    AUTODS_API_KEY:         !!process.env.AUTODS_API_KEY,
    RESEND_API_KEY:         !!process.env.RESEND_API_KEY,
    SERPER_API_KEY:         !!process.env.SERPER_API_KEY,
    AI_API_ENDPOINT:        !!process.env.AI_API_ENDPOINT,
    ADMIN_EMAIL:            !!process.env.ADMIN_EMAIL,
  }

  const criticalMissing = Object.entries(envKeys)
    .filter(([k, v]) => !v && ['STRIPE_SECRET_KEY','DATABASE_URL','STRIPE_WEBHOOK_SECRET'].includes(k))
    .map(([k]) => k)

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    overallHealth: criticalMissing.length === 0 ? 'operational' : 'degraded',
    criticalMissing,
    services: {
      lmStudio: lmStudio.status === 'fulfilled' ? lmStudio.value : { status: 'offline', error: String(lmStudio.reason) },
      stripe:   stripe.status   === 'fulfilled' ? stripe.value   : { status: 'offline', error: String(stripe.reason) },
      database: database.status === 'fulfilled' ? database.value : { status: 'offline', error: String(database.reason) },
    },
    envKeys,
  })
}

async function pingLMStudio() {
  const endpoint = process.env.AI_API_ENDPOINT || 'http://172.20.10.11:1234'
  const start = Date.now()
  try {
    const res = await fetch(`${endpoint}/v1/models`, {
      headers: { Authorization: `Bearer ${process.env.AI_API_KEY || ''}` },
      signal: AbortSignal.timeout(3000)
    })
    const data = await res.json().catch(() => ({}))
    return { status: res.ok ? 'online' : 'error', latencyMs: Date.now() - start, model: data?.data?.[0]?.id || 'unknown' }
  } catch (e: any) {
    throw new Error(`LM Studio unreachable: ${e.message}`)
  }
}

async function pingStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return { status: 'no_key' }
  const start = Date.now()
  try {
    const res = await fetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
      signal: AbortSignal.timeout(4000)
    })
    return { status: res.ok ? 'online' : 'error', latencyMs: Date.now() - start, httpStatus: res.status }
  } catch (e: any) {
    throw new Error(`Stripe unreachable: ${e.message}`)
  }
}

async function pingDatabase() {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'online', latencyMs: Date.now() - start }
  } catch (e: any) {
    throw new Error(`DB connection failed: ${e.message}`)
  }
}
