'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { TopAppBar } from '@/components/TopAppBar'

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  if (pathname === '/login') {
    return <div className="w-screen min-h-screen bg-surface-container-low m-0 p-0">{children}</div>
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col w-full h-screen overflow-y-auto bg-surface-container-low">
        <TopAppBar />
        {children}
      </div>
    </>
  )
}
