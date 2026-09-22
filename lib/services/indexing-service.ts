import { prisma } from '@/lib/db/prisma'

const INDEXNOW_KEY = 'a8f1e29c0d3b47f68a51e92d74b8301c'
const SITE_HOST = 'vexsen.com'
const SITE_URL = 'https://vexsen.com'

export interface IndexingResult {
  engine: string
  success: boolean
  statusCode: number
  message?: string
}

export class IndexingService {
  /**
   * Pings IndexNow API with updated/new URLs.
   * IndexNow broadcasts instantly to Bing, Yandex, Naver, and Seznam.
   */
  static async submitToIndexNow(urls: string[]): Promise<IndexingResult> {
    const formattedUrls = urls.map(u => (u.startsWith('http') ? u : `${SITE_URL}${u.startsWith('/') ? u : `/${u}`}`))

    try {
      const payload = {
        host: SITE_HOST,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: formattedUrls,
      }

      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000),
      })

      const ok = res.status === 200 || res.status === 202

      try {
        await prisma.systemLog.create({
          data: {
            level: ok ? 'info' : 'warn',
            source: 'INDEXNOW',
            message: `Submitted ${urls.length} URLs to IndexNow (Status: ${res.status})`,
            meta: JSON.stringify({ urls: formattedUrls.slice(0, 5) }),
          },
        })
      } catch {}

      return {
        engine: 'IndexNow (Bing/Yandex/Naver)',
        success: ok,
        statusCode: res.status,
        message: ok ? 'Dispatched to search engine index' : `Returned status ${res.status}`,
      }
    } catch (err: any) {
      console.error('[IndexingService] IndexNow error:', err)
      return {
        engine: 'IndexNow',
        success: false,
        statusCode: 500,
        message: err.message,
      }
    }
  }

  /**
   * Pings Google and Bing XML sitemap endpoints.
   */
  static async pingSitemaps(): Promise<IndexingResult[]> {
    const sitemapUrl = `${SITE_URL}/sitemap.xml`
    const targets = [
      { engine: 'Googlebot Sitemap Ping', url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
      { engine: 'Bing Sitemap Ping', url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
    ]

    const results: IndexingResult[] = []

    for (const target of targets) {
      try {
        const res = await fetch(target.url, { method: 'GET', signal: AbortSignal.timeout(5000) })
        results.push({
          engine: target.engine,
          success: res.ok,
          statusCode: res.status,
        })
      } catch (err: any) {
        results.push({
          engine: target.engine,
          success: false,
          statusCode: 500,
          message: err.message,
        })
      }
    }

    return results
  }

  /**
   * Master Ping: Sends both IndexNow batch and Sitemap notifications.
   */
  static async publishUrls(urls: string[]) {
    const [indexNowRes, sitemapResults] = await Promise.all([
      this.submitToIndexNow(urls),
      this.pingSitemaps(),
    ])

    return [indexNowRes, ...sitemapResults]
  }
}
