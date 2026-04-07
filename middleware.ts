// ============================================================
// MIDDLEWARE — Admin Route Protection
// Uses HTTP Basic Auth via environment variables.
// ADMIN_USER and ADMIN_PASS must be set in .env.local and Vercel dashboard.
// The /admin path is invisible to the public — no link from the frontend.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only protect admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const authHeader = req.headers.get('authorization')

  if (authHeader) {
    const base64 = authHeader.split(' ')[1] || ''
    const [user, pass] = atob(base64).split(':')

    if (
      user === process.env.ADMIN_USER &&
      pass === process.env.ADMIN_PASS
    ) {
      return NextResponse.next()
    }
  }

  // Challenge — browser shows native login prompt
  return new NextResponse('Admin access required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="TrendDrop Admin"',
    },
  })
}

export const config = {
  matcher: ['/admin/:path*'],
}
