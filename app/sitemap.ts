import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/prisma'
import { absoluteUrl } from '@/lib/config/site'

const NOW = new Date()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static routes with tuned priorities/frequencies ──────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'),            lastModified: NOW, changeFrequency: 'daily',   priority: 1.0 },
    { url: absoluteUrl('/collections'), lastModified: NOW, changeFrequency: 'daily',   priority: 0.9 },
    { url: absoluteUrl('/bundles'),     lastModified: NOW, changeFrequency: 'weekly',  priority: 0.8 },
    { url: absoluteUrl('/about'),       lastModified: NOW, changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/contact'),     lastModified: NOW, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/faq'),         lastModified: NOW, changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/referral'),    lastModified: NOW, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/guides'),      lastModified: NOW, changeFrequency: 'weekly',  priority: 0.7 },
    { url: absoluteUrl('/problems'),    lastModified: NOW, changeFrequency: 'weekly',  priority: 0.7 },
    { url: absoluteUrl('/solutions'),   lastModified: NOW, changeFrequency: 'weekly',  priority: 0.7 },
    // Legal / policy pages — rarely change, low priority
    { url: absoluteUrl('/legal/privacy'),  lastModified: NOW, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/legal/refund'),   lastModified: NOW, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/legal/shipping'), lastModified: NOW, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/legal/terms'),    lastModified: NOW, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/policies/privacy'),  lastModified: NOW, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/policies/refund'),   lastModified: NOW, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/policies/shipping'), lastModified: NOW, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/policies/terms'),    lastModified: NOW, changeFrequency: 'yearly', priority: 0.3 },
  ]

  let clusters: { targetSlug: string; targetPageType: string; updatedAt: Date }[] = []
  let products: { slug: string; updatedAt: Date; validationStatus: string }[] = []

  try {
    ;[clusters, products] = await Promise.all([
      prisma.keywordCluster.findMany({
        select: { targetSlug: true, targetPageType: true, updatedAt: true },
      }),
      prisma.product.findMany({
        where: { validationStatus: 'approved' },
        select: { slug: true, updatedAt: true, validationStatus: true },
        orderBy: { trendScore: 'desc' },
      }),
    ])
  } catch (error) {
    console.error('[sitemap] dynamic routes unavailable', error)
    return staticRoutes
  }

  // ── Guide cluster pages ───────────────────────────────────────────────────
  const guideRoutes: MetadataRoute.Sitemap = clusters
    .filter((c) => c.targetPageType === 'guide')
    .map((c) => ({
      url: absoluteUrl(`/guides/${c.targetSlug}`),
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  // ── Problem cluster pages ─────────────────────────────────────────────────
  const problemRoutes: MetadataRoute.Sitemap = clusters
    .filter((c) => c.targetPageType === 'problem')
    .map((c) => ({
      url: absoluteUrl(`/problems/${c.targetSlug}`),
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  // ── Solution cluster pages ────────────────────────────────────────────────
  const solutionRoutes: MetadataRoute.Sitemap = clusters
    .filter((c) => c.targetPageType === 'solution')
    .map((c) => ({
      url: absoluteUrl(`/solutions/${c.targetSlug}`),
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }))

  // ── Product pages — highest priority dynamic content ─────────────────────
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(`/products/${p.slug}`),
    lastModified: p.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  return [
    ...staticRoutes,
    ...productRoutes,
    ...guideRoutes,
    ...problemRoutes,
    ...solutionRoutes,
  ]
}
