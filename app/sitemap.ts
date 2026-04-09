import { MetadataRoute } from 'next'
import { keywordClusters } from '@/lib/data/keywords'

const SITE_URL = 'https://ai-dropshipping-2-nine.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  // 1. Static Routes
  const staticRoutes = [
    '',
    '/collections',
    '/bundles',
    '/guides',
    '/legal/privacy',
    '/legal/refund',
    '/legal/shipping',
    '/legal/terms',
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // 2. Programmatic Guide Routes
  const guideRoutes = keywordClusters
    .filter((c) => c.targetPageType === 'guide')
    .map((c) => ({
      url: `${SITE_URL}/guides/${c.targetSlug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  // 3. Programmatic Solution Routes
  const solutionRoutes = keywordClusters
    .filter((c) => c.targetPageType === 'solution')
    .map((c) => ({
      url: `${SITE_URL}/solutions/${c.targetSlug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

  return [...staticRoutes, ...guideRoutes, ...solutionRoutes]
}
