import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/admin/logs?level=error&limit=50
 * Returns real SystemLog records from DB.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const level = searchParams.get('level') || undefined
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

  const logs = await prisma.systemLog.findMany({
    where: level ? { level } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, level: true, source: true, message: true, meta: true, createdAt: true }
  })

  const errorCount = await prisma.systemLog.count({ where: { level: 'error' } })
  const warnCount  = await prisma.systemLog.count({ where: { level: 'warn' } })

  return NextResponse.json({ logs, errorCount, warnCount, total: logs.length })
}

/**
 * DELETE /api/admin/logs — clears all logs older than 7 days
 */
export async function DELETE() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const { count } = await prisma.systemLog.deleteMany({
    where: { createdAt: { lt: cutoff } }
  })
  return NextResponse.json({ deleted: count })
}
