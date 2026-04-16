/**
 * CJ DROPSHIPPING PRICE & STOCK SYNC CRON
 * Run hourly via Vercel Cron or manually from admin dashboard.
 * - Polls every approved/pending product that has a cjProductId
 * - Adjusts retail prices if supplier price changed → logs to PriceLog
 * - Auto-archives products where ALL variants hit zero stock
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { cj } from '@/lib/services/cj-service'
import { calculateTargetPrice } from '@/lib/utils/pricing'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Verify cron secret to prevent public abuse
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!cj.isConfigured()) {
    return NextResponse.json({ error: 'CJ API not configured' }, { status: 500 })
  }

  const started = Date.now()
  const logs: string[] = []
  let synced = 0, priceChanges = 0, stockUpdates = 0, autoArchived = 0

  // Fetch all products with a CJ link that are still active
  const products = await prisma.product.findMany({
    where: {
      cjProductId: { not: null },
      validationStatus: { in: ['pending', 'approved'] }
    },
    include: { variants: true },
    orderBy: { cjLastSyncedAt: 'asc' } // Sync oldest-synced first
  })

  for (const product of products) {
    if (!product.cjProductId) continue

    try {
      const fresh = await cj.refreshProductPriceAndStock(product.cjProductId)
      if (!fresh) {
        logs.push(`⚠️ ${product.title}: CJ returned no data`)
        continue
      }

      const priceChanged = Math.abs(fresh.supplierPrice - product.supplierPrice) > 0.01

      // ── Price Change ──────────────────────────────────────────
      if (priceChanged) {
        const newRetail = calculateTargetPrice(fresh.supplierPrice)
        await prisma.product.update({
          where: { id: product.id },
          data: { supplierPrice: fresh.supplierPrice, price: newRetail, cjLastSyncedAt: new Date() }
        })
        await prisma.priceLog.create({
          data: { productId: product.id, supplierPrice: fresh.supplierPrice, retailPrice: newRetail }
        })
        await prisma.systemLog.create({
          data: {
            level: 'info',
            source: 'cron:cj-sync',
            message: `Price change: "${product.title}" $${product.supplierPrice.toFixed(2)} → $${fresh.supplierPrice.toFixed(2)}`,
            meta: JSON.stringify({ productId: product.id, cjProductId: product.cjProductId })
          }
        })
        logs.push(`💰 ${product.title}: $${product.supplierPrice.toFixed(2)} → $${fresh.supplierPrice.toFixed(2)} (retail $${newRetail.toFixed(2)})`)
        priceChanges++
      }

      // ── Variant Stock Sync ────────────────────────────────────
      for (const fv of fresh.variants) {
        if (!fv.vid) continue
        const updated = await prisma.productVariant.updateMany({
          where: { vid: fv.vid },
          data: {
            cjStock: fv.stock,
            supplierPrice: fv.supplierPrice,
            retailPrice: calculateTargetPrice(fv.supplierPrice),
          }
        })
        if (updated.count > 0) stockUpdates++
      }

      // ── Update sync timestamp ─────────────────────────────────
      await prisma.product.update({
        where: { id: product.id },
        data: { cjLastSyncedAt: new Date() }
      })

      // ── Auto-archive if ALL variants are out of stock ─────────
      if (product.variants.length > 0 && fresh.variants.every(v => v.stock === 0)) {
        await prisma.product.update({
          where: { id: product.id },
          data: { validationStatus: 'archived' }
        })
        await prisma.systemLog.create({
          data: {
            level: 'warn',
            source: 'cron:cj-sync',
            message: `Auto-archived "${product.title}": all variants out of stock`,
            meta: JSON.stringify({ productId: product.id })
          }
        })
        logs.push(`🚫 Auto-archived ${product.title}: zero stock across all variants`)
        autoArchived++
      }

      synced++
    } catch (err: any) {
      logs.push(`❌ ${product.title}: ${err.message}`)
      await prisma.systemLog.create({
        data: {
          level: 'error',
          source: 'cron:cj-sync',
          message: `Sync failed for "${product.title}": ${err.message}`,
          meta: JSON.stringify({ productId: product.id, cjProductId: product.cjProductId })
        }
      })
    }
  }

  const duration = ((Date.now() - started) / 1000).toFixed(1)

  return NextResponse.json({
    success: true,
    summary: {
      totalProducts: products.length,
      synced,
      priceChanges,
      stockUpdates,
      autoArchived,
      durationSeconds: duration,
    },
    logs
  })
}
