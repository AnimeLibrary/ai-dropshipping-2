import { AIClient } from './ai-client'
import prisma from '../prisma'

/**
 * AI SEMANTIC ROUTER
 * Maps natural language "Problems" to their most relevant programmatic "Solutions".
 */

export class SemanticRouter {
  private ai = new AIClient()

  async findBestSlug(query: string): Promise<string> {
    console.log(`[Semantic Router] Mapping query: "${query}" to intent...`)

    // 1. Fetch available slugs for context
    // In a massive scale scenario, we'd use vector search (Supabase pgvector)
    // For "hundreds" of pages, we can provide the niche list to the LLM.
    const clusters = await prisma.keywordCluster.findMany({
      take: 100,
      select: { targetSlug: true, keyword: true, niche: true }
    })

    const slugMap = clusters.map(c => `${c.targetSlug} (${c.keyword})`).join(', ')

    const prompt = `
      User Problem: "${query}"
      Available Solution Pages: ${slugMap}
      
      Pick the absolute best solution slug from the list. If none are a strong match, respond with "discovery".
      Respond ONLY with the slug or "discovery".
    `

    const response = await this.ai.generateText(prompt, "You are a specialized router for a help-center. Your goal is to map user pain to the correct solution guide.")
    
    const result = response.trim().toLowerCase()
    
    // Safety check: ensure result is a valid slug or 'discovery'
    const validSlugs = clusters.map(c => c.targetSlug)
    if (validSlugs.includes(result)) {
        return result
    }

    return 'discovery'
  }
}
