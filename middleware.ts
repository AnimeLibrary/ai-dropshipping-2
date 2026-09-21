import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/account(.*)', '/admin(.*)', '/api/admin(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    try {
      const session = await auth()
      if (!session.userId) {
        return session.redirectToSignIn({ returnBackUrl: request.url })
      }
    } catch {
      // Fallback redirect if edge session retrieval encounters missing environment keys on Vercel
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
