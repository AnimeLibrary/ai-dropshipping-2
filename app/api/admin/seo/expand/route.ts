import { NextRequest, NextResponse } from 'next/server'
import { SEOStrategist } from '@/lib/services/seo-strategist'

export async function POST(req: NextRequest) {
  try {
    const { productId, count } = await req.json()

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 })
    }

    const strategist = new SEOStrategist()
    const clusters = await strategist.expandNicheForProduct(productId, count || 5)
    
    return NextResponse.json({ 
      success: true, 
      count: clusters.length,
      clusters: clusters
    })
  } catch (error: any) {
    console.error('[SEO Expansion API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
