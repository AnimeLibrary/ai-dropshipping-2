import { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/config/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api/',
        '/account',
      ],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
