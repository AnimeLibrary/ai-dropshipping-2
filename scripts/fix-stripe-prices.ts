/**
 * FIX & SYNCHRONIZE ALL STRIPE PRICES
 *
 * Scans every approved product and all of its variants.
 * Verifies each price in Stripe against the DB retailPrice.
 * If missing, invalid, or mismatched in amount, creates a fresh Stripe Price,
 * archives the old price, and updates Prisma DB.
 */

import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
})

function firstHttpImage(value?: string | null): string | undefined {
  if (!value) return undefined
  try {
    if (value.startsWith('[')) {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.find((img) => typeof img === 'string' && img.startsWith('http'))
      }
    }
  } catch {}
  return value.startsWith('http') ? value : undefined
}

function parseImages(value?: string | null): string[] {
  if (!value) return []
  try {
    if (value.startsWith('[')) {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.filter((img) => typeof img === 'string' && img.startsWith('http')).slice(0, 8)
      }
    }
  } catch {}
  return value.startsWith('http') ? [value] : []
}

async function fixStripePrices() {
  console.log('='.repeat(80))
  console.log('STRIPE PRICE SYNCHRONIZATION & REPAIR SCRIPT')
  console.log('='.repeat(80))

  const products = await prisma.product.findMany({
    where: { validationStatus: 'approved' },
    include: {
      variants: {
        orderBy: [{ isDefault: 'desc' }, { cjStock: 'desc' }],
      },
    },
    orderBy: { title: 'asc' },
  })

  console.log(`Found ${products.length} approved products to verify.\n`)

  for (const product of products) {
    console.log(`\n📦 Processing: "${product.title}" (${product.slug})`)
    console.log(`   DB Retail: $${Number(product.price).toFixed(2)} | Variants: ${product.variants.length}`)

    // 1. Ensure Stripe Product exists
    let stripeProductId = product.stripeProductId
    let stripeProd: Stripe.Product | null = null

    if (stripeProductId) {
      try {
        stripeProd = await stripe.products.retrieve(stripeProductId)
        if (!stripeProd.active) {
          stripeProd = await stripe.products.update(stripeProductId, { active: true })
        }
      } catch (err: any) {
        console.warn(`   ⚠️ Stripe product ${stripeProductId} not found. Will recreate.`)
        stripeProductId = null
      }
    }

    if (!stripeProductId) {
      const images = parseImages(product.heroImage)
      stripeProd = await stripe.products.create({
        name: product.title,
        description: product.shortDescription || `Vexsen verified essential for ${product.niche.replace(/-/g, ' ')}`,
        images,
        metadata: {
          productId: product.id,
          slug: product.slug,
          niche: product.niche,
          cjProductId: product.cjProductId || '',
        },
      })
      stripeProductId = stripeProd.id
      console.log(`   ✨ Created new Stripe Product: ${stripeProductId}`)
    }

    let defaultVariantPriceId: string | null = null

    // 2. Synchronize all variants
    if (product.variants.length > 0) {
      for (const variant of product.variants) {
        const expectedCents = Math.round(Number(variant.retailPrice) * 100)
        let needsNewPrice = false
        const oldPriceId = variant.stripeVariantPriceId

        if (!oldPriceId) {
          needsNewPrice = true
          console.log(`   ⚡ Variant "${variant.label}": missing Stripe price.`)
        } else {
          try {
            const existingPrice = await stripe.prices.retrieve(oldPriceId)
            if (existingPrice.unit_amount !== expectedCents) {
              console.log(
                `   🔴 Variant "${variant.label}": price mismatch! Stripe=${existingPrice.unit_amount}¢ vs DB=${expectedCents}¢ ($${Number(variant.retailPrice).toFixed(2)})`
              )
              needsNewPrice = true
            } else if (!existingPrice.active) {
              console.log(`   ⚠️ Variant "${variant.label}": Stripe price inactive.`)
              needsNewPrice = true
            } else {
              // Valid and matches!
              if (variant.isDefault && !defaultVariantPriceId) {
                defaultVariantPriceId = oldPriceId
              }
            }
          } catch (e: any) {
            console.log(`   ⚠️ Variant "${variant.label}": could not retrieve price ${oldPriceId} (${e.message})`)
            needsNewPrice = true
          }
        }

        if (needsNewPrice) {
          const newPrice = await stripe.prices.create({
            product: stripeProductId,
            unit_amount: expectedCents,
            currency: 'usd',
            nickname: variant.label,
            metadata: {
              productId: product.id,
              variantId: variant.id,
              vid: variant.vid,
              label: variant.label,
              color: variant.color || '',
              size: variant.size || '',
            },
          })

          console.log(`   ✅ Created Stripe Price ${newPrice.id} (${expectedCents}¢ = $${Number(variant.retailPrice).toFixed(2)}) for "${variant.label}"`)

          // Deactivate old price to prevent stale usage
          if (oldPriceId && oldPriceId !== newPrice.id) {
            try {
              await stripe.prices.update(oldPriceId, { active: false })
            } catch {}
          }

          // Update DB variant
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: { stripeVariantPriceId: newPrice.id },
          })

          if (variant.isDefault || !defaultVariantPriceId) {
            defaultVariantPriceId = newPrice.id
          }
        }
      }
    } else {
      // Single product price fallback
      const expectedCents = Math.round(Number(product.price) * 100)
      let needsNewPrice = false
      if (product.stripePriceId) {
        try {
          const p = await stripe.prices.retrieve(product.stripePriceId)
          if (p.unit_amount !== expectedCents || !p.active) needsNewPrice = true
          else defaultVariantPriceId = p.id
        } catch {
          needsNewPrice = true
        }
      } else {
        needsNewPrice = true
      }

      if (needsNewPrice) {
        const singlePrice = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: expectedCents,
          currency: 'usd',
        })
        defaultVariantPriceId = singlePrice.id
      }
    }

    // 3. Ensure product-level stripePriceId and stripeProductId match
    if (!defaultVariantPriceId && product.variants[0]) {
      const firstV = await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } })
      defaultVariantPriceId = firstV?.stripeVariantPriceId || null
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        stripeProductId,
        stripePriceId: defaultVariantPriceId,
      },
    })

    console.log(`   🎯 Product "${product.title}" updated: stripePriceId = ${defaultVariantPriceId}`)
  }

  console.log('\n' + '='.repeat(80))
  console.log('ALL STRIPE PRICES SYNCHRONIZED AND VERIFIED')
  console.log('='.repeat(80))
}

fixStripePrices()
  .catch((err) => {
    console.error('Fatal error during Stripe sync:', err)
  })
  .finally(() => prisma.$disconnect())
