import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const HOST = 'vexsen.com'
const KEY  = 'a8f1e29c0d3b47f68a51e92d74b8301c'

export async function POST() {
  try {
    const products = await prisma.product.findMany({ select: { slug: true } })

    const urlList = [
      `https://${HOST}/`,
      `https://${HOST}/products`,
      `https://${HOST}/faq`,
      `https://${HOST}/track`,
    ]
    for (const p of products) {
      urlList.push(`https://${HOST}/products/${p.slug}`)
    }
    try {
      const clusters = await prisma.keywordCluster.findMany({ select: { targetSlug: true } })
      for (const c of clusters) urlList.push(`https://${HOST}/guide/${c.targetSlug}`)
    } catch {}

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: `https://${HOST}/${KEY}.txt`,
        urlList,
      }),
    })

    return NextResponse.json({
      success: true,
      count: urlList.length,
      status: res.status,
      message: `${urlList.length} URLs submitted to IndexNow (Bing, Yandex, Seznam, Naver)`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
