import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/account(.*)', '/admin(.*)', '/api/admin(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    try {
      await auth.protect()
    } catch (err) {
      // If auth.protect() fails due to missing keys or token edge issues, cleanly redirect to login
      const signInUrl = new URL('/account', request.url)
      signInUrl.searchParams.set('redirect_url', request.url)
      return Response.redirect(signInUrl)
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
