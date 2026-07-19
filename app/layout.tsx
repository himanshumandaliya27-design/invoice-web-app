import type { Metadata } from 'next'
import './globals.css'
import { ClientLayoutWrapper } from './ClientLayoutWrapper'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export const metadata: Metadata = {
  title: 'Invoice Generator',
  description: 'Indian B2B Invoice Generation System',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get current path from headers
  const headersList = await headers()
  const pathname = headersList.get('x-invoke-path') || headersList.get('x-pathname') || ''

  // Public routes that don't need auth
  const isPublicRoute = pathname === '/login' || pathname.startsWith('/api/')

  if (!isPublicRoute) {
    const session = await auth()
    if (!session) {
      redirect('/login')
    }
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Aclonica for branding, Inter for UI readability */}
        <link href="https://fonts.googleapis.com/css2?family=Aclonica&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-background min-h-screen w-full m-0 p-0">
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  )
}
