import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { cj } from '@/lib/services/cj-service'

// GET or POST /api/admin/cron/cj-tracking
// Queries processing orders with a recorded CJ Order ID, checks CJ for carrier tracking,
// and updates the database record to 'shipped' with the tracking number.
export async function GET() {
  return handleSync()
}

export async function POST() {
  return handleSync()
}

async function handleSync() {
  try {
    if (!cj.isConfigured()) {
      return NextResponse.json({ message: 'CJ credentials not configured in .env', updated: 0 })
    }

    // Find orders still in 'processing' status with a CJ Order ID in fulfillmentLog
    const processingOrders = await prisma.order.findMany({
      where: {
        status: 'processing',
        fulfillmentLog: {
          contains: 'CJ Order ID:'
        }
      },
      take: 25,
      orderBy: { createdAt: 'desc' }
    })

    let updatedCount = 0
    const results = []

    for (const order of processingOrders) {
      // Extract CJ order ID from log string
      const match = order.fulfillmentLog?.match(/CJ Order ID:\s*([A-Za-z0-9_-]+)/)
      const cjOrderId = match ? match[1] : null

      if (!cjOrderId) continue

      try {
        const cjStatus = await cj.getOrderStatus(cjOrderId)

        if (cjStatus && cjStatus.trackingNumber) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'shipped',
              trackingNumber: cjStatus.trackingNumber,
              fulfillmentLog: `${order.fulfillmentLog || ''} | [SHIPPED] Tracking: ${cjStatus.trackingNumber} via ${cjStatus.shippingCarrier || 'CJPacket'}`
            }
          })

          await prisma.systemLog.create({
            data: {
              level: 'info',
              source: 'cron:cj-tracking',
              message: `Order #${order.id} updated with tracking: ${cjStatus.trackingNumber}`,
              meta: JSON.stringify({ orderId: order.id, cjOrderId, trackingNumber: cjStatus.trackingNumber })
            }
          })

          updatedCount++
          results.push({ orderId: order.id, trackingNumber: cjStatus.trackingNumber, status: 'shipped' })
        }
      } catch (err: any) {
        console.error(`[CJ Tracking Sync] Error checking order ${order.id}:`, err.message)
      }
    }

    return NextResponse.json({
      success: true,
      checked: processingOrders.length,
      updated: updatedCount,
      results
    })
  } catch (error: any) {
    console.error('[CJ Tracking Cron Error]:', error)
    return NextResponse.json({ error: error.message || 'Tracking sync failed' }, { status: 500 })
  }
}
