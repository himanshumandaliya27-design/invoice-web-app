import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'

import { TopAppBar } from '@/components/TopAppBar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Precision Ledger - Invoice Generator',
  description: 'Indian B2B Invoice Generation System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-background min-h-screen flex flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1 md:ml-64 flex flex-col w-full">
          <TopAppBar />
          {children}
        </div>
      </body>
    </html>
  )
}
