import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, title: true, slug: true, validationStatus: true, shortDescription: true, stripePriceId: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  for (const p of products) {
    const descPreview = p.shortDescription ? p.shortDescription.slice(0, 80) : '(null)'
    console.log(`[${p.validationStatus.toUpperCase()}] ${p.id} | ${p.slug} | stripe:${p.stripePriceId ? '✅' : '❌'}`)
    console.log(`  desc: "${descPreview}"`)
  }
  await prisma.$disconnect()
}
main().catch(console.error)
