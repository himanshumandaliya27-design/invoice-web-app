import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple proxy: redirect unauthenticated users to login
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes - pass through without any auth check
  if (
    pathname.startsWith('/api/') ||
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check for session cookie (NextAuth sets this)
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
  // Only run proxy on page routes, NOT on api routes or static files
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
