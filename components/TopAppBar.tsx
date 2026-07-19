'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { setActiveCompany, getActiveCompanyId } from '@/app/actions/company'

type Company = { id: string, name: string }

export function TopAppBar() {
  const [search, setSearch] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/company')
        const data = await res.json()
        setCompanies(data)
        
        const currentActive = await getActiveCompanyId()
        if (currentActive && data.some((c: Company) => c.id === currentActive)) {
          setActiveId(currentActive)
        } else if (data.length > 0) {
          setActiveId(data[0].id)
          await setActiveCompany(data[0].id)
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadData()
  }, [])

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`)
    }
  }

  const handleCompanyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value
    setActiveId(newId)
    await setActiveCompany(newId)
    router.refresh() // Refresh page to apply new active company to server components
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
        {companies.length > 0 && (
          <select 
            value={activeId || ''} 
            onChange={handleCompanyChange}
            className="hidden lg:block px-md py-sm bg-surface-container border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface focus:outline-none focus:border-primary max-w-[200px] truncate"
          >
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <Link href="/invoices/new" className="hidden lg:flex px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-colors scale-95 duration-150 active:scale-90 items-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create New
        </Link>
        <button 
          onClick={() => signOut()}
          className="hidden lg:flex px-md py-sm text-error font-label-md text-label-md border border-error rounded-lg hover:bg-error-container transition-colors scale-95 duration-150 items-center gap-xs"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Sign Out
        </button>
      </div>
    </header>
  )
}
