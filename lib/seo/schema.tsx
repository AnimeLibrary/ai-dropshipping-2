import React from 'react'
import { absoluteUrl } from '@/lib/config/site'

export function SchemaMarkup({ schema }: { schema: Record<string, any> | null | undefined }) {
  if (!schema) return null
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function productSchema(product: any) {
  if (!product) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.shortDescription || `Buy ${product.title} online.`,
    image: product.heroImage,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: product.price,
      availability: 'https://schema.org/InStock',
      url: absoluteUrl(`/products/${product.slug}`),
    },
    brand: {
      '@type': 'Brand',
      name: 'Vexsen',
    },
  }
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

export function articleSchema(article: { title: string; description: string; slug: string; section?: string }) {
  if (!article) return null
  const section = article.section || 'guides'

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    mainEntityOfPage: absoluteUrl(`/${section}/${article.slug}`),
    author: {
      '@type': 'Organization',
      name: 'Vexsen',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Vexsen',
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
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}
