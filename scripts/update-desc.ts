import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const COIN_PURSE_ID = 'cmnvh6kcg00077ktmck0l1rt9'

async function main() {
  await prisma.product.update({
    where: { id: COIN_PURSE_ID },
    data: { 
      shortDescription: 'Stop losing keys and cards in the void of your bag. A simple, structured daily carry designed to keep essentials secure and accessible.'
    }
  })
  console.log('✅ Updated coin purse shortDescription manually.')
  await prisma.$disconnect()
}

main().catch(console.error)
