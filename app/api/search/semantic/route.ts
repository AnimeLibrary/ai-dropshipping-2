import { NextResponse } from 'next/server'
import { SemanticRouter } from '@/lib/ai/semantic-router'

export async function POST(req: Request) {
  try {
    const { query } = await req.json()
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 })

    const router = new SemanticRouter()
    const targetSlug = await router.findBestSlug(query)

    if (targetSlug === 'discovery') {
        // Redirect to a general collection or discovery page
        return NextResponse.json({ url: '/collections' })
    }

    return NextResponse.json({ url: `/guides/${targetSlug}` })
  } catch (error: any) {
    console.error('[API Search] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
