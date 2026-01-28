import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname, search } = req.nextUrl
  
  // CRITICAL: Use strict check to avoid redirect loops in production
  // req.auth can be truthy without a valid user session, so we must check req.auth?.user
  const isAuthenticated = Boolean(req.auth?.user)
  
  // Full path including query string for redirect preservation
  const nextPath = pathname + (search || '')

  // Protect /app routes - redirect unauthenticated users to login
  if (pathname.startsWith('/app') && !isAuthenticated) {
    const loginUrl = new URL('/login', req.url)
    // Set both 'next' (our UI) and 'callbackUrl' (Auth.js default) for compatibility
    loginUrl.searchParams.set('next', encodeURIComponent(nextPath))
    loginUrl.searchParams.set('callbackUrl', nextPath)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from login page
  if (pathname === '/login' && isAuthenticated) {
    // Check for redirect target (next or callbackUrl)
    const next = req.nextUrl.searchParams.get('next')
    const callbackUrl = req.nextUrl.searchParams.get('callbackUrl')
    const redirectTarget = next || callbackUrl
    
    if (redirectTarget) {
      try {
        const decoded = decodeURIComponent(redirectTarget)
        // Preserve invite flow: redirect to accept-invite if that's where user was going
        if (decoded.startsWith('/accept-invite')) {
          return NextResponse.redirect(new URL(decoded, req.url))
        }
      } catch {
        // Invalid encoded URL, fall through to default redirect
      }
    }
    
    return NextResponse.redirect(new URL('/app/clients', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
