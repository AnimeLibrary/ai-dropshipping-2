import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// ============================================================
// MIDDLEWARE — Admin Route Protection & Clerk Auth
// ============================================================

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
// Protected client routes can be added here
const isProtectedRoute = createRouteMatcher(['/account(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // 1. HTTP Basic Auth for Admin Panel
  if (isAdminRoute(req)) {
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

  // 2. Protect Account Routes with Clerk
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
