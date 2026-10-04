import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

function escapeXml(unsafe: string | null | undefined): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${url.protocol}//${url.host}`

    const products = await prisma.product.findMany({
      where: {
        cjProductId: { not: null }
      },
      include: {
        variants: true
      },
      orderBy: { title: 'asc' }
    })

    const itemsXml: string[] = []

    for (const p of products) {
      const productUrl = `${baseUrl}/products/${p.slug}`
      const baseDesc = escapeXml(p.shortDescription || p.title)

      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          const itemId = escapeXml(`${p.id}_${v.vid || v.id}`)
          const itemTitle = escapeXml(`${p.title} - ${v.label}`)
          const itemImg = escapeXml(v.image || p.heroImage)
          const itemPrice = `${v.retailPrice.toFixed(2)} USD`
          const inStock = v.cjStock >= 0 ? 'in stock' : 'out of stock'

          itemsXml.push(`    <item>
      <g:id>${itemId}</g:id>
      <g:item_group_id>${escapeXml(p.id)}</g:item_group_id>
      <title>${itemTitle}</title>
      <description>${baseDesc}</description>
      <link>${escapeXml(productUrl)}</link>
      <g:image_link>${itemImg}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${inStock}</g:availability>
      <g:price>${itemPrice}</g:price>
      <g:brand>Vexsen</g:brand>
      <g:google_product_category>Health &amp; Beauty &gt; Personal Care &gt; Cosmetics &gt; Lip Makeup</g:google_product_category>
      <g:product_type>Cosmetics &gt; Lip Care &gt; ${escapeXml(p.title)}</g:product_type>
      <g:custom_label_0>${escapeXml(v.label)}</g:custom_label_0>
      <g:custom_label_1>${escapeXml(p.niche || 'Beauty')}</g:custom_label_1>
    </item>`)
        }
      } else {
        const itemId = escapeXml(p.id)
        const itemTitle = escapeXml(p.title)
        const itemImg = escapeXml(p.heroImage)
        const itemPrice = `${p.price.toFixed(2)} USD`

        itemsXml.push(`    <item>
      <g:id>${itemId}</g:id>
      <title>${itemTitle}</title>
      <description>${baseDesc}</description>
      <link>${escapeXml(productUrl)}</link>
      <g:image_link>${itemImg}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>${itemPrice}</g:price>
      <g:brand>Vexsen</g:brand>
      <g:google_product_category>Health &amp; Beauty &gt; Personal Care &gt; Cosmetics &gt; Lip Makeup</g:google_product_category>
    </item>`)
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Vexsen Catalog Feed</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Vexsen Official Beauty &amp; Lip Care Product Feed for TikTok Ads and Google Merchant</description>
${itemsXml.join('\n')}
  </channel>
</rss>`

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400'
      }
    })
  } catch (error: any) {
    console.error('Catalog feed generation error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
