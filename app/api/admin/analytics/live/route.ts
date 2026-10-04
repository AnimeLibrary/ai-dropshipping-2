import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const now = new Date()
    // Active now: seen in the last 3 minutes
    const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000)
    // Past 3 hours: seen in the last 3 hours
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)

    // Parallel fetch for speed
    const [
      activeVisitors,
      threeHourSessions,
      threeHourPageViews,
      activePagesGroup,
      topPagesGroup,
      recentViews,
    ] = await Promise.all([
      // Count distinct active visitors in last 3 minutes
      prisma.visitorSession.count({
        where: {
          lastSeenAt: { gte: threeMinutesAgo },
        },
      }),

      // Count unique visitors in past 3 hours
      prisma.visitorSession.count({
        where: {
          lastSeenAt: { gte: threeHoursAgo },
        },
      }),

      // Count total page views in past 3 hours
      prisma.pageView.count({
        where: {
          createdAt: { gte: threeHoursAgo },
        },
      }),

      // Active pages right now
      prisma.visitorSession.findMany({
        where: {
          lastSeenAt: { gte: threeMinutesAgo },
        },
        select: {
          currentPath: true,
          device: true,
          lastSeenAt: true,
        },
        take: 30,
        orderBy: { lastSeenAt: 'desc' },
      }),

      // Top pages in past 3 hours
      prisma.pageView.groupBy({
        by: ['path'],
        where: {
          createdAt: { gte: threeHoursAgo },
        },
        _count: {
          path: true,
        },
        orderBy: {
          _count: {
            path: 'desc',
          },
        },
        take: 8,
      }),

      // Recent 10 page views
      prisma.pageView.findMany({
        where: {
          createdAt: { gte: threeHoursAgo },
        },
        select: {
          id: true,
          path: true,
          referrer: true,
          createdAt: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Group active pages by count
    const pageCounts: Record<string, number> = {}
    for (const v of activePagesGroup) {
      pageCounts[v.currentPath] = (pageCounts[v.currentPath] || 0) + 1
    }
    const activePages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      activeNow: activeVisitors,
      visitorsPast3Hours: threeHourSessions,
      pageviewsPast3Hours: threeHourPageViews,
      activePages,
      topPages: topPagesGroup.map(tp => ({
        path: tp.path,
        views: tp._count.path,
      })),
      recentViews,
      serverTime: now.toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
