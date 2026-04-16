/**
 * [ONE-TIME SCRIPT]
 * Manually updates the shortDescription for a specific product.
 * Usage: cross-env TARGET_PRODUCT_ID=cmnvh... npx tsx scripts/update-desc.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Remove hardcoded IDs — use environment/cli args in production patterns
const TARGET_ID = process.env.TARGET_PRODUCT_ID || 'cmnvh6kcg00077ktmck0l1rt9'

async function main() {
  try {
    const exists = await prisma.product.findUnique({
      where: { id: TARGET_ID },
      select: { id: true }
    })
    
    if (!exists) {
      console.error(`Product ${TARGET_ID} not found.`)
      return
    }

    await prisma.product.update({
      where: { id: TARGET_ID },
      data: { 
        shortDescription: 'Stop losing keys and cards in the void of your bag. A simple, structured daily carry designed to keep essentials secure and accessible.'
      }
    })
    console.log(`✅ Updated shortDescription for product: ${TARGET_ID}`)
  } catch (error) {
    console.error('Failed to update product:', error)
  } finally {
    // Ensure DB connection closes even on failure
    await prisma.$disconnect()
  }
}

main()
