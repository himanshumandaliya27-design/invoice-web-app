'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function TopAppBar() {
  const [search, setSearch] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <header className="flex justify-between items-center w-full px-lg py-md sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant">
      <div className="flex items-center md:hidden">
        <span className="font-headline-md text-headline-md font-black text-primary">FinTrust</span>
      </div>
      
      <div className="hidden md:flex items-center gap-md flex-1 ml-lg">
        <div className="relative w-96">
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Search invoices, customers, or products..." 
            className="w-full pl-xl pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-md">
        <Link href="/invoices/new" className="hidden lg:flex px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-colors scale-95 duration-150 active:scale-90 items-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create New Invoice
        </Link>
        <Link href="/settings" className="hidden lg:flex px-md py-sm text-primary font-label-md text-label-md border border-primary rounded-lg hover:bg-surface-container transition-colors scale-95 duration-150">
          Switch Company
        </Link>
      </div>
    </header>
  )
}
