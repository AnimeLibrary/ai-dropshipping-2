import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * SURGICAL SEEDER
 * Populates the database with pre-analyzed, profit-vetted products.
 * Demonstrates the 'Surgical Link Capture' result logic.
 */
async function main() {
  console.log('🚀 Starting Surgical Data Pull...')

  const products = [
    {
      title: 'Ergo-Flow Spine Supporter',
      slug: 'ergo-flow-spine-supporter',
      description: 'The revolutionary spinal alignment tool designed for people who spend 8+ hours at a desk.',
      price: 49.99,
      supplierPrice: 15.00,
      heroImage: 'https://images.unsplash.com/photo-1591946614720-90a587da4a36?auto=format&fit=crop&q=80&w=800',
      category: 'health',
      source: 'surgical-link',
      trendScore: 94,
      validationStatus: 'approved',
      aiContent: {
        emotionalTrigger: 'The subtle, constant fear of permanent posture damage.',
        problemNarrative: "You don't just feel the pain in your lower back; you feel it in your productivity. Every shift in your chair is a reminder that your body wasn't built for a cubicle.",
        solutionAngle: "Not just a cushion, but a bio-mechanical reset button for your posture.",
        hooks: [
          "Stop the 'Desk-Slump' before it ruins your spine.",
          "The $15 fix for a $2000 chiropractor problem."
        ],
        faqs: [
          { q: "Is it machine washable?", a: "Yes, the outer mesh cover is fully removable and washable." }
        ]
      }
    },
    {
      title: 'Deep-Sync Sleep Guardian',
      slug: 'deep-sync-sleep-guardian',
      description: 'The only weighted sleep mask that uses scientifically-backed pressure points to shut off racing thoughts.',
      price: 34.99,
      supplierPrice: 11.00,
      heroImage: 'https://images.unsplash.com/photo-1519330377309-9ee1c6883347?auto=format&fit=crop&q=80&w=800',
      category: 'sleep',
      source: 'surgical-link',
      trendScore: 91,
      validationStatus: 'approved',
      aiContent: {
        emotionalTrigger: 'The exhaustion of being bone-tired but mentally wired.',
        problemNarrative: "It's 2 AM. You're exhausted. But the moment you close your eyes, your mind starts a marathon you never signed up for.",
        solutionAngle: "Gentle pressure that signals your nervous system to 'Safe Mode'.",
        hooks: [
          "The 'Off-Switch' for your racing mind.",
          "How I finally slept 8 hours without waking up once."
        ]
      }
    }
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...p,
        aiContent: p.aiContent as any, // Cast for JSON field
      }
    })
    console.log(`✓ Seeded: ${p.title}`)
  }

  console.log('✅ Surgical Content Ignition Complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
