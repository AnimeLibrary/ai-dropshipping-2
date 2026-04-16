import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/prisma'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-dropshipping-2-nine.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Fetch Dynamic Data
  const [clusters, products] = await Promise.all([
    prisma.keywordCluster.findMany({ select: { targetSlug: true, targetPageType: true, updatedAt: true } }),
    prisma.product.findMany({ where: { validationStatus: 'approved' }, select: { slug: true, updatedAt: true } })
  ])

  // 2. Static Routes
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

  // 3. Programmatic Guide Routes
  const guideRoutes = clusters
    .filter((c) => c.targetPageType === 'guide')
    .map((c) => ({
      url: `${SITE_URL}/guides/${c.targetSlug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  // 4. Programmatic Product Routes
  const productRoutes = products.map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...guideRoutes, ...productRoutes]
}
