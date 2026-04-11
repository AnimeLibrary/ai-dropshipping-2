import { AIClient } from './ai-client'

/**
 * AI AD STRATEGIST
 * Reverse-engineers winning Minea ads to fuel your store's copywriting.
 */

export interface AdAngleProposal {
  hook: string
  problemStatement: string
  solutionAngle: string
  emotionalTrigger: string
  targetAudience: string
  platformStrategy: string
}

export class AdStrategist {
  private ai = new AIClient()

  /**
   * Generates a marketing strategy based on Minea ad intelligence and product data.
   */
  async proposeStrategy(productTitle: string, adData: { platform: string; score: number }): Promise<AdAngleProposal> {
    console.log(`[AI Ad Strategist] Analyzing ${productTitle} via Minea Metrics...`)

    const prompt = `
      Product: ${productTitle}
      Platform: ${adData.platform}
      Success Score: ${adData.score}/100

      Create a 10/10 ad creative strategy. 
      Focus on a "Problem-Solution" hook that hits an emotional trigger.
      The goal is to stop the scroll in under 2 seconds.
    `

    const schema = `
      {
        "hook": "string",
        "problemStatement": "string",
        "solutionAngle": "string",
        "emotionalTrigger": "string",
        "targetAudience": "string",
        "platformStrategy": "string"
      }
    `

    const result = await this.ai.generateStructuredData<AdAngleProposal>(prompt, schema)

    if (result.error === 'MISSING_API_KEY') {
       return this.generateMockProposal(productTitle, adData)
    }

    return result.data || this.generateMockProposal(productTitle, adData)
  }

  private generateMockProposal(productTitle: string, adData: any): AdAngleProposal {
    return {
      hook: `The 'Secret Hack' Angle: Why ${productTitle} is the unusual tool fixing a common daily frustration.`,
      problemStatement: "Dealing with the daily exhaustion of manual chores.",
      solutionAngle: "Position as a 'cheat code' for a better lifestyle.",
      emotionalTrigger: "Relief from years of broken, anxious sleep",
      targetAudience: adData.platform === 'tiktok' ? "Gen Z & Millennials" : "Homeowners (35-55)",
      platformStrategy: `For ${adData.platform.toUpperCase()}: Use fast-paced jump cuts and prioritize the first 3-second visual 'wow' factor.`
    }
  }
}
