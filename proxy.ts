import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// proxy: redirect unauthenticated users to login for page routes only
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // All API routes, static files and login pass through freely
  if (
    pathname.startsWith('/api/') ||
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check for session cookie (NextAuth v5 sets this)
  const sessionToken =
    request.cookies.get('__Secure-authjs.session-token')?.value ||
    request.cookies.get('authjs.session-token')?.value

  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Only run on page routes - completely exclude api routes
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
