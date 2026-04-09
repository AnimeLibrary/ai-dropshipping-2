import { PrismaClient } from '@prisma/client'
import { products } from './products'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting product sync...')

  for (const product of products) {
    console.log(`Syncing product: ${product.title}`)
    
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        title: product.title,
        shortDescription: product.shortDescription,
        longDescription: product.longDescription,
        category: product.category,
        niche: product.niche,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        supplierPrice: product.supplierPrice,
        heroImage: product.heroImage,
        trendScore: product.trendScore,
        source: product.source,
        validationStatus: product.validationStatus,
        suppliers: {
          deleteMany: {},
          create: product.suppliers.map(s => ({
            name: s.name,
            url: s.url,
            price: s.price,
            shippingDays: s.shippingDays,
            isReliable: s.isReliable,
            isCheapest: s.isCheapest
          }))
        }
      },
      create: {
        // Use ID from static data if available, or omit to let Prisma generate CUID
        slug: product.slug,
        title: product.title,
        shortDescription: product.shortDescription,
        longDescription: product.longDescription,
        category: product.category,
        niche: product.niche,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        supplierPrice: product.supplierPrice,
        heroImage: product.heroImage,
        trendScore: product.trendScore,
        source: product.source,
        validationStatus: product.validationStatus,
        suppliers: {
          create: product.suppliers.map(s => ({
            name: s.name,
            url: s.url,
            price: s.price,
            shippingDays: s.shippingDays,
            isReliable: s.isReliable,
            isCheapest: s.isCheapest
          }))
        }
      }
    })
  }

  console.log('Sync complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
