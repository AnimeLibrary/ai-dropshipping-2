import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// ============================================================
// MIDDLEWARE — Admin Route Protection & Clerk Auth
// ============================================================

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
// Protected client routes can be added here
const isProtectedRoute = createRouteMatcher(['/account(.*)'])

export default clerkMiddleware(async (auth, req) => {
  try {
    // 1. HTTP Basic Auth for Admin Panel
    if (isAdminRoute(req)) {
      const authHeader = req.headers.get('authorization')

      if (authHeader && authHeader.startsWith('Basic ')) {
        const base64 = authHeader.split(' ')[1]
        if (base64) {
          const decoded = atob(base64)
          const [user, pass] = decoded.split(':')

          if (
            user === process.env.ADMIN_USER &&
            pass === process.env.ADMIN_PASS
          ) {
            return NextResponse.next()
          }
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
      const authResult = await auth()
      authResult.protect()
    }
  } catch (error) {
    console.error('Middleware Error:', error)
    // Fallback — allow the request to proceed but log the error
    // This prevents a 500 error from taking down the whole site
    return NextResponse.next()
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
