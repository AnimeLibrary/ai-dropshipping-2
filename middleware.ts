import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// ============================================================
// MIDDLEWARE — Admin Route Protection & Clerk Auth
// ============================================================

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
// Protected client routes can be added here
const isProtectedRoute = createRouteMatcher(['/account(.*)', '/admin(.*)'])

export default async function middleware(req: NextRequest) {
  try {
    // 2. Clerk Protection Layer
    const hasClerkKeys = !!process.env.CLERK_SECRET_KEY && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    
    if (hasClerkKeys) {
      // Use Clerk middleware if keys are present
      return (clerkMiddleware(async (auth, request) => {
        if (isProtectedRoute(request)) {
          const authResult = await auth()
          authResult.protect()
        }
        return NextResponse.next()
      }))(req, {} as any)
    } else {
      console.warn('[MIDDLEWARE] Clerk API keys are missing. Bypassing auth check.')
    }

    return NextResponse.next()
  } catch (error) {
    console.error('[MIDDLEWARE] Fatal Error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
