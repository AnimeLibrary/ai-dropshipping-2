const { PrismaClient } = require('@prisma/client')

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres.rkgmdtjibfawjafyziaq:rHSXH36q3DCgiwwG@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require'
const prisma = new PrismaClient({
  datasources: {
    db: { url: dbUrl }
  }
})

async function main() {
  console.log('--- STARTING CLEAN SLATE DATABASE RESET ---')

  // 1. Delete order items & orders
  const deletedOrderItems = await prisma.orderItem.deleteMany({})
  console.log(`Deleted OrderItems: ${deletedOrderItems.count}`)

  const deletedOrders = await prisma.order.deleteMany({})
  console.log(`Deleted Orders: ${deletedOrders.count}`)

  // 2. Delete reviews, price logs, suppliers, variants
  const deletedReviews = await prisma.review.deleteMany({})
  console.log(`Deleted Reviews: ${deletedReviews.count}`)

  const deletedPriceLogs = await prisma.priceLog.deleteMany({})
  console.log(`Deleted PriceLogs: ${deletedPriceLogs.count}`)

  const deletedSuppliers = await prisma.supplier.deleteMany({})
  console.log(`Deleted Suppliers: ${deletedSuppliers.count}`)

  const deletedVariants = await prisma.productVariant.deleteMany({})
  console.log(`Deleted ProductVariants: ${deletedVariants.count}`)

  // 3. Delete products
  const deletedProducts = await prisma.product.deleteMany({})
  console.log(`Deleted Products: ${deletedProducts.count}`)

  // 4. Delete system logs
  const deletedLogs = await prisma.systemLog.deleteMany({})
  console.log(`Deleted SystemLogs: ${deletedLogs.count}`)

  console.log('--- WIPE COMPLETE: ALL OLD PRODUCTS & DATA CLEARED ---')
}

main()
  .catch((e) => {
    console.error('Wipe failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
