import { PrismaClient } from '@prisma/client'

// ============================================================
// PRISMA SINGLETON
// Prevents connection pool exhaustion in Next.js dev/prod.
// Import from here instead of instantiating new PrismaClient().
// ============================================================

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
