/**
 * MINEA SMART IMPORTER
 * Specialized parser for Minea 'Winning Product' CSV exports.
 * Helps you go from Minea research to live AI pages in seconds.
 */

export interface MineaImportedProduct {
  id: string
  title: string
  adUrl: string
  price: number
  successScore: number
  platform: 'tiktok' | 'facebook' | 'pinterest'
  hook?: string
}

export class MineaImporter {
  /**
   * Parses a raw CSV string from a Minea export.
   * Handles column mapping and clean-up.
   */
  async parseCSV(rawContent: string): Promise<MineaImportedProduct[]> {
    console.log('[Minea Importer] Parsing raw content...')
    
    // Very basic CSV split (handling standard Minea headers)
    const lines = rawContent.split('\n').filter(l => l.trim())
    const headers = lines[0].split(',')

    // Map headers to indices
    const findIndex = (keyword: string) => headers.findIndex(h => h.toLowerCase().includes(keyword))
    const titleIdx = findIndex('name') || findIndex('product')
    const adUrlIdx = findIndex('ad') || findIndex('url')
    const scoreIdx = findIndex('score') || findIndex('success')
    const platformIdx = findIndex('platform') || findIndex('source')

    const products: MineaImportedProduct[] = lines.slice(1).map((line, i) => {
      const cells = line.split(',')
      return {
        id: `minea-${i}`,
        title: (cells[titleIdx] || 'Imported Product').replace(/"/g, ''),
        adUrl: (cells[adUrlIdx] || '#').replace(/"/g, ''),
        price: 29.99, // Default if not in CSV
        successScore: parseInt(cells[scoreIdx]) || 85,
        platform: (cells[platformIdx]?.toLowerCase() || 'tiktok') as any,
      }
    })

    console.log(`[Minea Importer] Successfully parsed ${products.length} surgical candidates.`)
    return products
  }
}
