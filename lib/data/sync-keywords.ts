import { PrismaClient } from '@prisma/client'
import { keywordClusters } from './keywords'

const prisma = new PrismaClient()

async function syncKeywords() {
  console.log('🔄 Starting Keyword Cluster Sync...')

  for (const cluster of keywordClusters) {
    console.log(`📡 Syncing cluster: ${cluster.keyword}`)
    
    await prisma.keywordCluster.upsert({
      where: { targetSlug: cluster.targetSlug },
      update: {
        keyword: cluster.keyword,
        searchVolume: cluster.searchVolume,
        competition: cluster.competition,
        intent: cluster.intent,
        trend: cluster.trend,
        niche: cluster.niche,
        relatedKeywords: cluster.relatedKeywords,
        relatedSlugs: cluster.relatedPages, // Mapping renamed field
        painPoint: cluster.painPoint,
        solutionAngle: cluster.solutionAngle,
        targetPageType: cluster.targetPageType,
        source: cluster.source,
      },
      create: {
        keyword: cluster.keyword,
        searchVolume: cluster.searchVolume,
        competition: cluster.competition,
        intent: cluster.intent,
        trend: cluster.trend,
        niche: cluster.niche,
        relatedKeywords: cluster.relatedKeywords,
        relatedSlugs: cluster.relatedPages, // Mapping renamed field
        painPoint: cluster.painPoint,
        solutionAngle: cluster.solutionAngle,
        targetSlug: cluster.targetSlug,
        targetPageType: cluster.targetPageType,
        source: cluster.source,
      },
    })
  }

  console.log('✅ Keyword Cluster Sync Complete.')
}

syncKeywords()
  .catch((e) => {
    console.error('❌ Sync Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
