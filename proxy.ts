export { auth as proxy } from "@/auth"

export const config = {
  // Protect all routes except static assets, api/auth, and favicon
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
