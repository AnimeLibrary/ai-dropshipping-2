/**
 * VARIANT & STRIPE AUDIT SCRIPT
 * 1. Lists all products + their variants from DB
 * 2. Checks which variants are missing stripeVariantPriceId
 * 3. Verifies existing Stripe price IDs are valid and match expected amounts
 * 4. Reports mismatches so we can fix them
 */

import Stripe from 'stripe'

const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_URL || ''

// We'll use raw pg since we can't easily run prisma from a script context
// Actually, let's use prisma directly
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
})

interface AuditResult {
  productId: string
  productTitle: string
  productSlug: string
  dbPrice: number
  dbStripePriceId: string | null
  variantCount: number
  variants: {
    id: string
    vid: string
    label: string
    retailPrice: number
    supplierPrice: number
    stripeVariantPriceId: string | null
    cjStock: number
    isDefault: boolean
    stripeStatus?: string // 'valid' | 'price_mismatch' | 'not_found' | 'missing'
    stripeActualAmount?: number
  }[]
  issues: string[]
}

async function verifyStripePrice(priceId: string): Promise<{ valid: boolean; amount?: number; active?: boolean; error?: string }> {
  try {
    const price = await stripe.prices.retrieve(priceId)
    return { valid: true, amount: price.unit_amount || 0, active: price.active }
  } catch (e: any) {
    return { valid: false, error: e.message }
  }
}

async function audit() {
  console.log('='.repeat(80))
  console.log('VARIANT & STRIPE PRICE AUDIT')
  console.log('='.repeat(80))
  console.log('')

  const products = await prisma.product.findMany({
    where: { validationStatus: 'approved' },
    include: {
      variants: {
        orderBy: [{ isDefault: 'desc' }, { cjStock: 'desc' }]
      }
    },
    orderBy: { title: 'asc' }
  })

  console.log(`Found ${products.length} approved products\n`)

  const results: AuditResult[] = []
  let totalIssues = 0

  for (const product of products) {
    const result: AuditResult = {
      productId: product.id,
      productTitle: product.title,
      productSlug: product.slug,
      dbPrice: Number(product.price),
      dbStripePriceId: product.stripePriceId,
      variantCount: product.variants.length,
      variants: [],
      issues: [],
    }

    // Check product-level stripePriceId
    if (!product.stripePriceId) {
      result.issues.push('Product has NO stripePriceId set')
    } else {
      const check = await verifyStripePrice(product.stripePriceId)
      if (!check.valid) {
        result.issues.push(`Product stripePriceId "${product.stripePriceId}" is INVALID in Stripe: ${check.error}`)
      } else {
        const expectedCents = Math.round(Number(product.price) * 100)
        if (check.amount !== expectedCents) {
          result.issues.push(`Product stripePriceId price mismatch: Stripe=${check.amount}¢ vs DB=${expectedCents}¢ ($${Number(product.price).toFixed(2)})`)
        }
        if (!check.active) {
          result.issues.push(`Product stripePriceId "${product.stripePriceId}" is INACTIVE in Stripe`)
        }
      }
    }

    if (product.variants.length === 0) {
      result.issues.push('Product has ZERO variants in DB')
    }

    for (const v of product.variants) {
      const vResult: AuditResult['variants'][0] = {
        id: v.id,
        vid: v.vid,
        label: v.label,
        retailPrice: Number(v.retailPrice),
        supplierPrice: Number(v.supplierPrice),
        stripeVariantPriceId: v.stripeVariantPriceId,
        cjStock: v.cjStock,
        isDefault: v.isDefault,
      }

      if (!v.stripeVariantPriceId) {
        vResult.stripeStatus = 'missing'
        result.issues.push(`Variant "${v.label}" (${v.vid}) has NO stripeVariantPriceId`)
      } else {
        const check = await verifyStripePrice(v.stripeVariantPriceId)
        if (!check.valid) {
          vResult.stripeStatus = 'not_found'
          result.issues.push(`Variant "${v.label}" stripeVariantPriceId "${v.stripeVariantPriceId}" is INVALID: ${check.error}`)
        } else {
          const expectedCents = Math.round(Number(v.retailPrice) * 100)
          vResult.stripeActualAmount = check.amount
          if (check.amount !== expectedCents) {
            vResult.stripeStatus = 'price_mismatch'
            result.issues.push(`Variant "${v.label}" PRICE MISMATCH: Stripe=${check.amount}¢ vs DB=${expectedCents}¢ ($${Number(v.retailPrice).toFixed(2)})`)
          } else {
            vResult.stripeStatus = 'valid'
          }
        }
      }

      // Margin check
      const margin = (Number(v.retailPrice) - Number(v.supplierPrice)) / Number(v.retailPrice)
      if (margin < 0.20) {
        result.issues.push(`Variant "${v.label}" margin is dangerously low: ${(margin * 100).toFixed(1)}% (supplier=$${Number(v.supplierPrice).toFixed(2)}, retail=$${Number(v.retailPrice).toFixed(2)})`)
      }

      result.variants.push(vResult)
    }

    totalIssues += result.issues.length
    results.push(result)
  }

  // Print results
  for (const r of results) {
    const status = r.issues.length === 0 ? '✅' : '⚠️'
    console.log(`${status} ${r.productTitle} (${r.productSlug})`)
    console.log(`   DB Price: $${r.dbPrice.toFixed(2)} | stripePriceId: ${r.dbStripePriceId || 'NONE'} | Variants: ${r.variantCount}`)
    
    for (const v of r.variants) {
      const vStatus = v.stripeStatus === 'valid' ? '✓' : v.stripeStatus === 'missing' ? '✗' : '⚡'
      console.log(`     ${vStatus} [${v.isDefault ? 'DEFAULT' : '       '}] "${v.label}" vid=${v.vid} retail=$${v.retailPrice.toFixed(2)} supplier=$${v.supplierPrice.toFixed(2)} stock=${v.cjStock} stripe=${v.stripeVariantPriceId || 'NONE'}${v.stripeActualAmount !== undefined ? ` (${v.stripeActualAmount}¢)` : ''}`)
    }

    if (r.issues.length > 0) {
      for (const issue of r.issues) {
        console.log(`   🔴 ${issue}`)
      }
    }
    console.log('')
  }

  console.log('='.repeat(80))
  console.log(`SUMMARY: ${results.length} products, ${totalIssues} total issues`)
  console.log(`Products with issues: ${results.filter(r => r.issues.length > 0).length}`)
  console.log(`Products clean: ${results.filter(r => r.issues.length === 0).length}`)
  console.log('='.repeat(80))

  return results
}

audit()
  .catch(err => {
    console.error('Audit failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
