import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api',
        '/account',
        '/_next',
        '/static',
      ],
    },
    sitemap: 'https://ai-dropshipping-2-nine.vercel.app/sitemap.xml',
  }
}
