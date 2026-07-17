import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"

const providers: any[] = []

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google)
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(GitHub)
}

// Always provide a fallback credentials login if OAuth isn't set up
providers.push(
  Credentials({
    name: "Admin Password",
    credentials: {
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      // If ADMIN_PASSWORD is set in env, use it. Otherwise, default to "admin123"
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123"
      
      if (credentials?.password === adminPassword) {
        return { id: "1", name: "Admin User", email: "admin@invoice.local" }
      }
      return null
    },
  })
)

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || "fallback_secret_for_development_only_12345",
  providers,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth')
      const isLoginRoute = nextUrl.pathname === '/login'
      
      if (isApiAuthRoute || isLoginRoute) return true
      
      if (!isLoggedIn) return false
      
      return true
    },
  },
})
