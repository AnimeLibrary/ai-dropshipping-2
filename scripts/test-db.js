const { PrismaClient } = require('@prisma/client')

async function test(url, label) {
  const p = new PrismaClient({ datasources: { db: { url } } })
  try {
    const c = await p.product.count()
    console.log(`[${label}] SUCCESS! Product count:`, c)
  } catch (e) {
    console.error(`[${label}] FAILED:`, e.message)
  } finally {
    await p.$disconnect()
  }
}

async function run() {
  await test(
    'postgresql://postgres.rkgmdtjibfawjafyziaq:rHSXH36q3DCgiwwG@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
    'Port 5432 Direct'
  )
  await test(
    'postgresql://postgres.rkgmdtjibfawjafyziaq:rHSXH36q3DCgiwwG@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require',
    'Port 6543 Pooler with sslmode'
  )
}

run()
