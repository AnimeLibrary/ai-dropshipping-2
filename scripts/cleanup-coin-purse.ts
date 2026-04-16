/**
 * Cleanup script for the coin purse product.
 * Deletes mismatched seeded reviews and re-runs enrichment.
 * Run once with: npx tsx scripts/cleanup-coin-purse.ts
 */
import { PrismaClient } from '@prisma/client'
import { enrichProductWithAI } from '../lib/ai/agent-tools'

const prisma = new PrismaClient()
const COIN_PURSE_ID = 'cmnvh6kcg00077ktmck0l1rt9'

async function main() {
  console.log('🧹 Cleaning coin purse product data...\n')

  // 1. Check current state
  const product = await prisma.product.findUnique({
    where: { id: COIN_PURSE_ID },
    include: { reviews: true, variants: true },
  })
  if (!product) { console.error('Product not found'); return }
  console.log(`Product: ${product.title}`)
  console.log(`Reviews in DB: ${product.reviews.length}`)
  console.log(`Variants: ${product.variants.length}`)

  // 2. Delete ALL pending/seeded reviews (these are the mismatched posture reviews)
  const deleted = await prisma.review.deleteMany({
    where: { productId: COIN_PURSE_ID, status: { in: ['pending', 'seeded'] } }
  })
  console.log(`\n✅ Deleted ${deleted.count} mismatched review(s)`)

  // 3. Clear internal analysis data from shortDescription / longDescription
  const INTERNAL_PATTERNS = ['guardrail', 'saturation', 'APPROVE', 'TikTok UGC', 'margin', 'Niche saturation']
  const hasInternalDesc = INTERNAL_PATTERNS.some(p =>
    (product.shortDescription || '').toLowerCase().includes(p.toLowerCase())
  )
  const hasInternalLong = INTERNAL_PATTERNS.some(p =>
    (product.longDescription || '').toLowerCase().includes(p.toLowerCase())
  )
  if (hasInternalDesc || hasInternalLong) {
    await prisma.product.update({
      where: { id: COIN_PURSE_ID },
      data: {
        ...(hasInternalDesc && { shortDescription: null }),
        ...(hasInternalLong && { longDescription: null }),
      }
    })
    console.log(`✅ Cleared internal data from: ${[hasInternalDesc && 'shortDescription', hasInternalLong && 'longDescription'].filter(Boolean).join(', ')}`)
  } else {
    console.log('✅ No internal data in shortDescription / longDescription')
  }

  // 4. Re-run AI enrichment to generate clean storefront copy + real images
  console.log('\n🤖 Running AI enrichment...')
  try {
    const result = await enrichProductWithAI(COIN_PURSE_ID, product.title, product.niche)
    if (result.success) {
      console.log(`✅ Enrichment done! New description: "${result.data?.shortDescription?.slice(0, 80)}..."`)
    } else {
      console.warn('⚠️ Enrichment failed (AI may be offline):', result.error)
      console.log('   Manually set shortDescription in admin to fix the product copy.')
    }
  } catch (e: any) {
    console.warn('⚠️ Enrichment threw:', e.message)
  }

  // 5. Make sure at least one variant shows as in-stock so checkout works
  if (product.variants.length > 0 && product.variants.every(v => v.cjStock === 0)) {
    await prisma.productVariant.updateMany({
      where: { productId: COIN_PURSE_ID },
      data: { cjStock: 999 }, // Placeholder stock — update via CJ refresh when API is connected
    })
    console.log('✅ Set placeholder stock so checkout is available')
  }

  await prisma.$disconnect()
  console.log('\n🎉 Cleanup complete. Reload the product page to verify.')
}

main().catch(console.error)
