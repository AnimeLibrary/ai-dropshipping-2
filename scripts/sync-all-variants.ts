import { prisma } from '../lib/db/prisma'
import { cj } from '../lib/services/cj-service'

async function syncAllExistingProducts() {
  const products = await prisma.product.findMany({
    include: { variants: true }
  })

  console.log(`Starting sync for ${products.length} products...`)

  for (const product of products) {
    if (!product.cjProductId) {
      console.log(`Skipping "${product.title}" (no CJ PID)`)
      continue
    }

    console.log(`\nFetching fresh details from CJ for "${product.title}" (PID: ${product.cjProductId})...`)
    const full = await cj.getFullProductWithVariants(product.cjProductId)
    if (!full || !full.variants || full.variants.length === 0) {
      console.warn(`Could not get variants from CJ for PID ${product.cjProductId}`)
      continue
    }

    console.log(`Found ${full.variants.length} CJ variants. Syncing to database...`)

    for (const v of full.variants) {
      // Find existing variant by vid or create if missing
      const existing = product.variants.find(pv => pv.vid === v.vid)
      if (existing) {
        await prisma.productVariant.update({
          where: { id: existing.id },
          data: {
            label: v.label,
            color: v.color || null,
            size: v.size || null,
            image: v.image || existing.image || product.heroImage,
            cjStock: v.stock,
            supplierPrice: v.supplierPrice,
          }
        })
        console.log(`  Updated variant ${v.vid} -> label: "${v.label}", color: "${v.color}", size: "${v.size}"`)
      } else {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            vid: v.vid,
            sku: v.sku,
            label: v.label,
            color: v.color || null,
            size: v.size || null,
            supplierPrice: v.supplierPrice,
            retailPrice: product.price,
            cjStock: v.stock,
            image: v.image || product.heroImage,
            isDefault: false,
          }
        })
        console.log(`  Created missing variant ${v.vid} -> label: "${v.label}"`)
      }
    }

    // Ensure product has a valid stripePriceId set from default variant if missing
    if (!product.stripePriceId) {
      const def = product.variants.find(pv => pv.isDefault) || product.variants[0]
      if (def?.stripeVariantPriceId) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            stripePriceId: def.stripeVariantPriceId,
            primaryVariantId: def.id,
          }
        })
        console.log(`  Set stripePriceId for "${product.title}" to ${def.stripeVariantPriceId}`)
      }
    }
  }

  console.log('\nAll products and variants synced successfully!')
}

syncAllExistingProducts()
  .catch(err => {
    console.error('Sync failed:', err)
  })
  .finally(() => prisma.$disconnect())
