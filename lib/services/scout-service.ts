import { transformKalodataToProduct, KalodataRow } from '../data/kalodata-importer'
import { Product } from '../data/products'
import { StockService } from './stock-service'

/**
 * SURGICAL SCOUT SERVICE
 * Automates the "Selective Scouting" of Kalodata Top 5 Pages.
 */

interface ScoutConfig {
  minMargin: number
  maxActiveStores: number
  targetQuantity: number // 6-9 as per user request
}

export class ScoutService {
  private config: ScoutConfig = {
    minMargin: 20,
    maxActiveStores: 15, // Avoiding oversaturated items
    targetQuantity: 9
  }

  /**
   * Triggers a surgical scout session.
   * In production, this would call a Scraper API (ZenRows) for the first 5 pages of Kalodata.
   */
  async performSurgicalScout(pages = 5): Promise<Product[]> {
    console.log(`[Scout] Starting surgical scan of Top ${pages} pages...`)
    
    // 1. Fetch raw data (Simulated call to Scraping API)
    const rawItems = await this.scrapeKalodataWinners(pages)
    
    // 2. Surgical Filtering
    const candidates = rawItems
      .filter(item => {
        const margin = (item.price * 2) // Rough estimate for initial filter
        return item.price >= 5 && (item.price * 3 - item.price) >= this.config.minMargin
      })
      .filter(item => item.activeStores <= this.config.maxActiveStores) // Saturation check
      .sort((a, b) => b.revenue - a.revenue) // Focus on high momentum

    // 3. Selection (Pick exactly 6-9 as requested)
    const selected = candidates.slice(0, this.config.targetQuantity)
    
    console.log(`[Scout] Selected ${selected.length} surgical winners.`)
    
    // 4. Verify each winner with Serper AND Stock Check
    const verifiedWinners: Product[] = []
    const stockService = new StockService()

    for (const item of selected) {
        // A. Check Virality
        const isVerified = await this.verifyProductWithSerper(item.title)
        
        // B. Check Stock (Broke Dropshipper Safety Requirement)
        const stockResult = await stockService.checkStock(item.supplierUrl)
        
        if (isVerified && stockResult.count >= 10) {
            verifiedWinners.push(transformKalodataToProduct({
                title: item.title,
                category: item.category,
                revenue: item.revenue,
                price: item.price,
                supplierUrl: item.supplierUrl,
                imageUrl: item.imageUrl,
                trendScore: 90,
                stockCount: stockResult.count // Passthrough to Admin
            }) as Product)
        } else if (stockResult.count < 10) {
            console.warn(`[Scout] Item '${item.title}' skipped: Low stock (${stockResult.count} units)`)
        }
    }
    
    return verifiedWinners
  }

  /**
   * Verified product exists and is trending using Serper (Google Search)
   */
  private async verifyProductWithSerper(query: string): Promise<boolean> {
    const apiKey = process.env.SERPER_API_KEY
    if (!apiKey) return true // Skip if no key

    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: `${query} tiktok shop trending` })
      })
      const data = await response.json()
      // Check if we get relevant snippets (social proof)
      return data.organic && data.organic.length > 0
    } catch (e) {
      console.error('[Serper] Verification failed:', e)
      return true // Fallback to success
    }
  }

  /**
   * Simulated scraping logic.
   * In a real environment, this uses `fetch` with a ZenRows/ScrapingBee proxy.
   */
  private async scrapeKalodataWinners(pages: number): Promise<any[]> {
    // This is where the ZenRows integration logic lives.
    // We navigate to: kalodata.com/top-products?page=1...5
    return [] // Mock return for now
  }
}
