import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { getAdminUser } from '@/lib/auth/admin'

export async function POST(req: NextRequest) {
  try {
    // Auth check: allow if logged-in admin or dev mode
    const admin = await getAdminUser()
    const isDev = process.env.NODE_ENV === 'development'
    const authHeader = req.headers.get('x-admin-secret')
    const hasSecret = Boolean(
      process.env.CRON_SECRET && authHeader === process.env.CRON_SECRET
    )

    if (!admin && !isDev && !hasSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate mime type
    const validPrefixes = ['image/', 'video/']
    const isValidType = validPrefixes.some(prefix => file.type.startsWith(prefix))
    if (!isValidType) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload an image or video.' },
        { status: 400 }
      )
    }

    // 50 MB limit
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum allowed size is 50MB.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true })
    }

    // Clean filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileName = `${Date.now()}-${safeName}`
    const filePath = join(uploadsDir, fileName)

    await writeFile(filePath, buffer)

    const publicUrl = `/uploads/${fileName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      size: file.size,
      type: file.type,
    })
  } catch (error: any) {
    console.error('[media-upload] error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to upload media file' },
      { status: 500 }
    )
  }
}
