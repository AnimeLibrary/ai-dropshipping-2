import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/account(.*)', '/admin(.*)', '/api/admin(.*)'])

export default clerkMiddleware(
  async (auth, request) => {
    // In local development, allow direct access so the admin dashboard & tools work smoothly
    if (process.env.NODE_ENV === 'development' && (
      request.nextUrl.pathname.startsWith('/admin') ||
      request.nextUrl.pathname.startsWith('/api/admin')
    )) {
      return NextResponse.next()
    }

    if (isProtectedRoute(request)) {
      try {
        await auth.protect()
      } catch {
        const signInUrl = new URL('/account', request.url)
        signInUrl.searchParams.set('redirect_url', request.url)
        return NextResponse.redirect(signInUrl)
      }
    }
  },
  {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_dWx0aW1hdGUtZWdyZXQtMzUuY2xlcmsuYWNjb3VudHMuZGV2JA',
  }
)

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
