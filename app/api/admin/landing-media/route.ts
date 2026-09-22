import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getLandingMedia, saveLandingMedia, DEFAULT_LANDING_MEDIA } from '@/lib/landing-media'
import { getAdminUser } from '@/lib/auth/admin'

async function isAuthorized(req: NextRequest): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') return true
  const admin = await getAdminUser()
  if (admin) return true
  const headerSecret = req.headers.get('x-admin-secret')
  if (process.env.CRON_SECRET && headerSecret === process.env.CRON_SECRET) return true
  return false
}

export async function GET() {
  try {
    const config = await getLandingMedia()
    return NextResponse.json({ success: true, config })
  } catch (error: any) {
    console.error('[landing-media GET] error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve landing media' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const authorized = await isAuthorized(req)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    if (body.action === 'reset') {
      const resetConfig = await saveLandingMedia(DEFAULT_LANDING_MEDIA)
      revalidatePath('/')
      return NextResponse.json({ success: true, config: resetConfig })
    }

    const updated = await saveLandingMedia(body)
    revalidatePath('/')

    return NextResponse.json({ success: true, config: updated })
  } catch (error: any) {
    console.error('[landing-media POST] error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update landing media' },
      { status: 500 }
    )
  }
}
