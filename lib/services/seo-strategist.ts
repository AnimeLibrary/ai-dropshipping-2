import { AIClient } from '../ai/ai-client'
import prisma from '../prisma'

/**
 * AI SEO STRATEGIST
 * Responsible for niche expansion and automated semantic clustering.
 */

export interface GeneratedCluster {
  keyword: string
  searchVolume: number
  competition: 'low' | 'medium' | 'high'
  intent: 'informational' | 'transactional' | 'problem-solution' | 'comparison'
  trend: 'rising' | 'stable'
  painPoint: string
  solutionAngle: string
  relatedKeywords: string[]
  aiContent: {
    empathyIntro: string
    deepProblemAnalysis: string
    scienceBehindSolution: string
    faq: Array<{ q: string; a: string }>
  }
}

export class SEOStrategist {
  private ai = new AIClient()

  /**
   * Generates a semantic cluster of SEO niches for a specific product.
   */
  async expandNicheForProduct(productId: string, count = 5) {
    console.log(`[SEO Strategist] Expanding niche for product: ${productId}`)

    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) throw new Error('Product not found')

    const prompt = `
      Product: ${product.title}
      Category: ${product.category}
      Niche: ${product.niche}
      
      Generate ${count} high-intent SEO keyword clusters that solve a human problem using this product.
      Each cluster MUST include a deeply empathetic narrative ("aiContent") that explains the pain before selling.
      
      Requirements for aiContent:
      - empathyIntro: 2-3 sentences validating the user's struggle.
      - deepProblemAnalysis: Why standard fixes fail and what the real root cause is.
      - scienceBehindSolution: How the solution actually works on a physical or emotional level.
      - faq: 3 niche-specific Q&As.
    `

    const schema = `
      {
        "clusters": [
          {
            "keyword": "string",
            "searchVolume": 1000,
            "competition": "low|medium|high",
            "intent": "informational|transactional|problem-solution|comparison",
            "trend": "rising|stable",
            "painPoint": "empathy-driven description of the suffering",
            "solutionAngle": "how the product category fixes it",
            "relatedKeywords": ["array", "of", "keywords"],
            "aiContent": {
              "empathyIntro": "string",
              "deepProblemAnalysis": "string",
              "scienceBehindSolution": "string",
              "faq": [{"q": "string", "a": "string"}]
            }
          }
        ]
      }
    `

    const result = await this.ai.generateStructuredData<{ clusters: GeneratedCluster[] }>(prompt, schema)

    if (result.error === 'MISSING_API_KEY') {
        return this.generateMockClusters(product.niche)
    }

    if (!result.data || !result.data.clusters) {
      console.warn('[SEO Strategist] AI suggested no clusters or failed.')
      return []
    }

    // Persist new clusters and link to product
    const createdClusters = []
    for (const data of result.data.clusters) {
      const slug = data.keyword.toLowerCase().replace(/\s+/g, '-')
      
      const cluster = await prisma.keywordCluster.upsert({
        where: { targetSlug: slug },
        update: {
          products: { connect: { id: productId } },
          aiContent: data.aiContent as any
        },
        create: {
          keyword: data.keyword,
          searchVolume: data.searchVolume,
          competition: data.competition,
          intent: data.intent,
          trend: data.trend,
          niche: product.niche,
          painPoint: data.painPoint,
          solutionAngle: data.solutionAngle,
          targetSlug: slug,
          targetPageType: 'guide',
          relatedKeywords: data.relatedKeywords,
          relatedSlugs: [],
          aiContent: data.aiContent as any,
          products: { connect: { id: productId } }
        }
      })
      createdClusters.push(cluster)
    }

    // Run Cross-Linking logic within the new batch
    await this.crossLinkClusters(createdClusters)

    return createdClusters
  }

  /**
   * Automatically builds internal links between clusters in the same niche.
   */
  private async crossLinkClusters(clusters: any[]) {
    const slugs = clusters.map(c => c.targetSlug)
    for (const cluster of clusters) {
      const others = slugs.filter(s => s !== cluster.targetSlug)
      await prisma.keywordCluster.update({
        where: { id: cluster.id },
        data: {
          relatedSlugs: { set: others }
        }
      })
    }
  }

  /**
   * Safety fallback for dev/testing without keys
   */
  private generateMockClusters(niche: string): any[] {
     console.log(`[SEO Strategist] Generating mock clusters for niche: ${niche}`)
     return [] // Return empty in mock mode for now
  }
}
