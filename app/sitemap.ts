import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/prisma'
import { absoluteUrl } from '@/lib/config/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/faq',
    '/collections',
    '/bundles',
    '/guides',
    '/problems',
    '/solutions',
    '/referral',
    '/legal/privacy',
    '/legal/refund',
    '/legal/shipping',
    '/legal/terms',
  ].map((route) => ({
    url: absoluteUrl(route || '/'),
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  let clusters: { targetSlug: string; targetPageType: string; updatedAt: Date }[] = []
  let products: { slug: string; updatedAt: Date }[] = []

  try {
    ;[clusters, products] = await Promise.all([
      prisma.keywordCluster.findMany({ select: { targetSlug: true, targetPageType: true, updatedAt: true } }),
      prisma.product.findMany({ where: { validationStatus: 'approved' }, select: { slug: true, updatedAt: true } })
    ])
  } catch (error) {
    console.error('[sitemap] dynamic routes unavailable', error)
    return staticRoutes
  }

  const guideRoutes = clusters
    .filter((c) => c.targetPageType === 'guide')
    .map((c) => ({
      url: absoluteUrl(`/guides/${c.targetSlug}`),
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  const problemRoutes = clusters
    .filter((c) => c.targetPageType === 'problem')
    .map((c) => ({
      url: absoluteUrl(`/problems/${c.targetSlug}`),
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  const productRoutes = products.map((p) => ({
    url: absoluteUrl(`/products/${p.slug}`),
    lastModified: p.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...guideRoutes, ...problemRoutes, ...productRoutes]
}
