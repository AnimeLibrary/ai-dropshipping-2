import React from 'react'

export function SchemaMarkup({ schema }: { schema: Record<string, any> }) {
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
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/products/${product.slug}`,
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
      item: `${process.env.NEXT_PUBLIC_SITE_URL}${crumb.href}`,
    })),
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
