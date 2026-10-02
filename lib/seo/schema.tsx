import React from 'react'
import { absoluteUrl, siteConfig } from '@/lib/config/site'

export function SchemaMarkup({ schema }: { schema: Record<string, any> | null | undefined }) {
  if (!schema) return null
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function productSchema(
  product: any,
  reviews?: { author: string; rating: number; body: string; createdAt: Date }[]
) {
  if (!product) return null
  const heroImages = (() => {
    try {
      if (typeof product.heroImage === 'string' && product.heroImage.startsWith('[')) {
        const arr = JSON.parse(product.heroImage)
        return Array.isArray(arr) ? arr.filter((s: any) => typeof s === 'string' && s.startsWith('http')) : []
      }
    } catch {}
    return product.heroImage?.startsWith?.('http') ? [product.heroImage] : []
  })()
  const avgRating = reviews && reviews.length > 0
    ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null
  const productUrl = absoluteUrl(`/products/${product.slug}`)
  const priceValidUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: product.title,
    description: product.shortDescription || `Buy ${product.title} online at Vexsen.`,
    image: heroImages.length === 1 ? heroImages[0] : heroImages.length > 1 ? heroImages : undefined,
    sku: product.id,
    mpn: product.cjProductId || product.id,
    brand: { '@type': 'Brand', name: 'Vexsen' },
    offers: {
      '@type': 'Offer',
      '@id': `${productUrl}#offer`,
      url: productUrl,
      priceCurrency: 'USD',
      price: Number(product.price).toFixed(2),
      priceValidUntil,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'Vexsen', url: siteConfig.url },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: '4.95', currency: 'USD' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: ['US', 'CA', 'GB', 'AU'] },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 7, maxValue: 12, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'US',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
    },
  }
  if (avgRating && reviews && reviews.length > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    }
    schema.review = reviews.slice(0, 5).map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.body,
      datePublished: new Date(r.createdAt).toISOString().split('T')[0],
    }))
  }
  return schema
}

export function breadcrumbSchema(breadcrumbs: { name: string; href: string }[]) {
  if (!breadcrumbs || breadcrumbs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.href),
    })),
  }
}

export function articleSchema(article: {
  title: string; description: string; slug: string; section?: string; datePublished?: string; dateModified?: string
}) {
  if (!article) return null
  const section = article.section || 'guides'
  const url = absoluteUrl(`/${section}/${article.slug}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: { '@type': 'Organization', name: 'Vexsen', url: siteConfig.url },
    publisher: {
      '@type': 'Organization',
      name: 'Vexsen',
      url: siteConfig.url,
      logo: { '@type': 'ImageObject', url: `${siteConfig.url}/icon.svg` },
    },
  }
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  if (!faqs || faqs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}

export function collectionPageSchema(products: { title: string; slug: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Vexsen Store — All Products',
    description: 'Browse every curated Vexsen product. Waterproof peel-off lip stains, juicy lip oils, and beauty essentials. Every item is verified before it ships.',
    url: absoluteUrl('/collections'),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.slice(0, 20).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absoluteUrl(`/products/${p.slug}`),
        name: p.title,
      })),
    },
  }
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: 'Vexsen',
    legalName: 'Vexsen LLC',
    url: siteConfig.url,
    logo: { '@type': 'ImageObject', url: `${siteConfig.url}/icon.svg`, width: 512, height: 512 },
    sameAs: ['https://www.tiktok.com/@vexsen', 'https://www.instagram.com/vexsenofficial'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@vexsen.com',
      availableLanguage: 'English',
    },
  }
}
