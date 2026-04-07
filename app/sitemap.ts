import { MetadataRoute } from 'next'
import { keywordClusters } from '@/lib/data/keywords'
import { getApprovedProducts } from '@/lib/data/products'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://trenddrop.store'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/collections`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/guides`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/problems`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/solutions`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/bundles`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  ]

  // Dynamic guide pages (from keyword clusters)
  const guideClusters = keywordClusters.filter((c) => c.targetPageType === 'guide')
  const guidePages: MetadataRoute.Sitemap = guideClusters.map((c) => ({
    url: `${BASE_URL}/guides/${c.targetSlug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: c.trend === 'rising' ? 0.85 : 0.75,
  }))

  // Dynamic problem pages
  const problemClusters = keywordClusters.filter((c) => c.targetPageType === 'problem')
  const problemPages: MetadataRoute.Sitemap = problemClusters.map((c) => ({
    url: `${BASE_URL}/problems/${c.targetSlug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }))

  // Dynamic solution pages
  const solutionClusters = keywordClusters.filter((c) => c.targetPageType === 'solution')
  const solutionPages: MetadataRoute.Sitemap = solutionClusters.map((c) => ({
    url: `${BASE_URL}/solutions/${c.targetSlug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // Dynamic product pages (approved only)
  const productPages: MetadataRoute.Sitemap = getApprovedProducts().map((p) => ({
    url: `${BASE_URL}/products/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  return [...staticPages, ...guidePages, ...problemPages, ...solutionPages, ...productPages]
}
