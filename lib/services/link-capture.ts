import { AIClient } from '../ai/ai-client'

/**
 * LINK CAPTURE SERVICE (AI Page Intelligence)
 * Goes 'in via link' to collect data from any competitor or supplier page.
 */

export interface CapturedPageData {
  title: string
  description: string
  price: number
  specs: string[]
  faqs: Array<{ question: string; answer: string }>
  emotionalTrigger?: string
  competitorPrice?: number
}

export class LinkCaptureService {
  private ai = new AIClient()

  /**
   * Captures and analyzes a page's content from a raw URL.
   */
  async captureLink(url: string): Promise<CapturedPageData | null> {
    console.log(`[Link Capture] Navigating to: ${url}...`)

    try {
      // 1. Fetch raw HTML content
      // In production, handles 403s with a proxy like ZenRows
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch page')
      
      const html = await response.text()

      // 2. Clean the HTML (Strip JS, CSS, Tags) to save tokens
      const cleanText = html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .substring(0, 10000) // Take the first 10k chars for the AI to analyze

      // 3. AI Structured Extraction
      const prompt = `
        Analyze this raw text from a product page:
        ---
        ${cleanText}
        ---
        Extract exactly what this product is, its price, its technical specs, and any common FAQs. 
        Also, identify the 'Emotional Trigger' (the pain it solves).
      `

      const schema = `
        {
          "title": "string",
          "description": "string",
          "price": "number",
          "specs": ["string"],
          "faqs": [{"question": "string", "answer": "string"}],
          "emotionalTrigger": "string",
          "competitorPrice": "number"
        }
      `

      const result = await this.ai.generateStructuredData<CapturedPageData>(prompt, schema)
      return result.data
    } catch (e: any) {
      console.error('[Link Capture] Failed:', e.message)
      return null
    }
  }
}
