import { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/config/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // General crawlers: allow everything except private/internal paths
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/account',
          '/success',
          '/_next/',
        ],
      },
      {
        // Google & Googlebot-Image: allow full indexing of homepage, logo/favicons, product pages and rich media
        userAgent: ['Googlebot', 'Googlebot-Image', 'Google-InspectionTool'],
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/account',
          '/success',
        ],
      },
      {
        // Block AI/scraper bots that don't respect noindex
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'CCBot',
          'anthropic-ai',
          'Claude-Web',
          'Omgilibot',
          'FacebookBot',
        ],
        disallow: '/',
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  }
}
