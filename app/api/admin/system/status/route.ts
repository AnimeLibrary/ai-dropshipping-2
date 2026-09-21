import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/admin'

/**
 * GET /api/admin/system/status
 * Returns real status of every required env var and service.
 * No fake toggles. Every check is a real HTTP ping or null check.
 */
export async function GET() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

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
    CJ_EMAIL:               !!process.env.CJ_EMAIL,
    CJ_API_KEY:             !!process.env.CJ_API_KEY,
    AUTODS_API_KEY:         !!process.env.AUTODS_API_KEY,
    RESEND_API_KEY:         !!process.env.RESEND_API_KEY,
    SERPER_API_KEY:         !!process.env.SERPER_API_KEY,
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
      lmStudio: lmStudio.status === 'fulfilled' ? lmStudio.value : { status: 'optional (disabled)', latencyMs: 0 },
      stripe:   stripe.status   === 'fulfilled' ? stripe.value   : { status: 'offline', error: String(stripe.reason) },
      database: database.status === 'fulfilled' ? database.value : { status: 'offline', error: String(database.reason) },
    },
    envKeys,
  })
}

async function pingLMStudio() {
  const endpoint = process.env.AI_API_ENDPOINT || 'http://127.0.0.1:1234'
  const start = Date.now()
  try {
    const res = await fetch(`${endpoint}/v1/models`, {
      headers: { Authorization: `Bearer ${process.env.AI_API_KEY || ''}` },
      signal: AbortSignal.timeout(1500)
    })
    const data = await res.json().catch(() => ({}))
    return { status: res.ok ? 'online' : 'optional (disabled)', latencyMs: Date.now() - start, model: data?.data?.[0]?.id || 'none' }
  } catch {
    return { status: 'optional (disabled)', latencyMs: 0, model: 'not running' }
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
