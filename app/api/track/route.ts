import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { visitorId, path, referrer, isHeartbeat } = body

    if (!visitorId || typeof visitorId !== 'string') {
      return NextResponse.json({ error: 'Missing visitorId' }, { status: 400 })
    }

    const currentPath = typeof path === 'string' && path.length ? path.slice(0, 500) : '/'
    
    // Ignore admin paths from visitor analytics
    if (currentPath.startsWith('/admin') || currentPath.startsWith('/api/admin')) {
      return NextResponse.json({ ignored: true })
    }

    const userAgent = req.headers.get('user-agent') || undefined
    const isMobile = userAgent ? /mobile|iphone|android|ipad/i.test(userAgent) : false
    const device = isMobile ? 'mobile' : 'desktop'
    const now = new Date()

    if (isHeartbeat) {
      // Just keep session alive
      await prisma.visitorSession.upsert({
        where: { visitorId },
        create: {
          visitorId,
          currentPath,
          referrer: typeof referrer === 'string' ? referrer.slice(0, 500) : null,
          userAgent: userAgent ? userAgent.slice(0, 300) : null,
          device,
          pageViews: 1,
          startedAt: now,
          lastSeenAt: now,
        },
        update: {
          currentPath,
          lastSeenAt: now,
        },
      })

      return NextResponse.json({ success: true, type: 'heartbeat' })
    }

    // New page view
    await prisma.visitorSession.upsert({
      where: { visitorId },
      create: {
        visitorId,
        currentPath,
        referrer: typeof referrer === 'string' ? referrer.slice(0, 500) : null,
        userAgent: userAgent ? userAgent.slice(0, 300) : null,
        device,
        pageViews: 1,
        startedAt: now,
        lastSeenAt: now,
      },
      update: {
        currentPath,
        pageViews: { increment: 1 },
        lastSeenAt: now,
      },
    })

    // Log the granular page view event
    await prisma.pageView.create({
      data: {
        visitorId,
        path: currentPath,
        referrer: typeof referrer === 'string' ? referrer.slice(0, 500) : null,
        createdAt: now,
      },
    })

    return NextResponse.json({ success: true, type: 'pageview' })
  } catch (error: any) {
    // Fail silently without disrupting shopper experience
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
