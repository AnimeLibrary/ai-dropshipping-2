/**
 * AI CLIENT WRAPPER
 * Centralized interface for LLM calls (Gemini, OpenAI, etc.)
 */

export interface AIResponse<T> {
  data: T | null
  error?: string
}

export class AIClient {
  private apiKey: string | undefined
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.AI_API_KEY || 'not-needed-local'
    this.baseUrl = process.env.AI_API_ENDPOINT || 'http://127.0.0.1:1234'
  }

  /**
   * Universal completion method for structured JSON data.
   */
  async generateStructuredData<T>(prompt: string, schemaDescription: string): Promise<AIResponse<T>> {
    // Local Llama doesn't always need a key, so we allow it to proceed
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama-3.1-8b-instruct',
          messages: [
            { 
              role: 'system', 
              content: `You are an expert Dropshipping SEO Strategist. Always respond with valid JSON matching this schema: ${schemaDescription}` 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        })
      })

      const json = await response.json()
      
      if (!json.choices && json.error) {
         throw new Error(json.error.message || 'AI Proxy Error')
      }

      const content = json.choices[0].message.content
      return { data: JSON.parse(content) as T }
    } catch (error: any) {
      console.error('[AI Client] Generation failed:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Helper for quick text completions.
   */
  async generateText(prompt: string, systemMessage?: string): Promise<string> {
    if (!this.apiKey) return 'Mock AI Response: Please set AI_API_KEY'

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'gpt-4o',
          messages: [
            { role: 'system', content: systemMessage || 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
          ]
        })
      })

      const json = await response.json()
      return json.choices[0].message.content
    } catch (e) {
      return 'AI generation failed.'
    }
  }
}
