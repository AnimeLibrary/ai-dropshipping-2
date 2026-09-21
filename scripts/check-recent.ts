import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, title: true, validationStatus: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  })
  console.log(products)
}
main().catch(console.error).finally(() => prisma.$disconnect())
