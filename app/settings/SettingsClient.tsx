'use client'

import { useState } from 'react'
import { setActiveCompany } from '@/app/actions/company'
import { useRouter } from 'next/navigation'

type Company = {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  gstin: string
  currency: string
  bank_name: string | null
  account_number: string | null
  ifsc_code: string | null
  upi_id: string | null
  smtp_host: string | null
  smtp_port: number | null
  smtp_user: string | null
  smtp_pass: string | null
}

const emptyCompany: Omit<Company, 'id'> = {
  name: '',
  address: '',
  phone: '',
  email: '',
  gstin: '',
  currency: 'INR',
  bank_name: '',
  account_number: '',
  ifsc_code: '',
  upi_id: '',
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_user: '',
  smtp_pass: ''
}

export default function SettingsClient({ 
  initialCompanies, 
  initialActiveId 
}: { 
  initialCompanies: Company[], 
  initialActiveId: string | null 
}) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies)
  const [activeId, setActiveId] = useState<string | null>(initialActiveId)
  
  // Setup initial company to edit
  const initialCompanyToEdit = initialActiveId 
    ? initialCompanies.find((c: Company) => c.id === initialActiveId) || initialCompanies[0] 
    : (initialCompanies.length > 0 ? initialCompanies[0] : null)
    
  const [company, setCompany] = useState<Company | Omit<Company, 'id'> | null>(initialCompanyToEdit || { ...emptyCompany })
  const [isNew, setIsNew] = useState(initialCompanies.length === 0)
  
  const router = useRouter()

  const refreshData = async () => {
    try {
      const res = await fetch('/api/companies')
      const data = await res.json()
      setCompanies(data)
      router.refresh()
    } catch (error) {
      console.error(error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (company) {
      setCompany({ ...company, [e.target.name]: e.target.value })
    }
  }

  const handleSelectCompany = (id: string) => {
    const selected = companies.find(c => c.id === id)
    if (selected) {
      setCompany(selected)
      setIsNew(false)
    }
  }

  const handleAddNew = () => {
    setIsNew(true)
    setCompany({ ...emptyCompany })
  }

  const handleSetAsActive = async (id: string) => {
    await setActiveCompany(id)
    setActiveId(id)
    router.refresh()
    alert('Company set as active!')
  }

  const handleSave = async () => {
    if (!company) return
    if (!company.name || !company.gstin) {
      alert('Company Name and GSTIN are required.')
      return
    }

    try {
      if (isNew) {
        const res = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(company)
        })
        const newComp = await res.json()
        alert('New company created successfully!')
        
        if (companies.length === 0) {
          await setActiveCompany(newComp.id)
          setActiveId(newComp.id)
        }
        
        setIsNew(false)
        await refreshData()
      } else {
        const c = company as Company
        await fetch(`/api/companies/${c.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(company)
        })
        alert('Settings saved successfully!')
        await refreshData()
      }
      
    } catch (error) {
      console.error(error)
      alert('Failed to save settings')
    }
  }

  if (!company) return <div className="p-xl text-center text-on-surface-variant">Error loading state.</div>

  return (
    <main className="flex-1 p-lg lg:p-xl max-w-container-max mx-auto w-full space-y-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg md:font-headline-lg md:text-headline-lg font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Settings</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Manage your companies and preferences.</p>
        </div>
        <div className="flex gap-sm w-full sm:w-auto">
          <button 
            onClick={handleAddNew}
            className="w-full sm:w-auto px-md py-sm bg-surface-variant text-on-surface-variant font-label-md text-label-md rounded-lg hover:bg-outline-variant transition-colors flex items-center justify-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">add_business</span>
            Add New Company
          </button>
          <button 
            onClick={handleSave}
            className="w-full sm:w-auto px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-colors flex items-center justify-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-lg">
        {/* Sidebar for multiple companies */}
        <div className="bg-surface border border-outline-variant rounded-xl p-md space-y-sm h-fit">
          <h3 className="font-headline-sm text-headline-sm text-on-surface px-sm pb-sm border-b border-outline-variant">Your Companies</h3>
          <div className="flex flex-col gap-xs pt-sm">
            {companies.map(c => (
              <div 
                key={c.id} 
                className={`p-sm rounded-lg border cursor-pointer transition-colors flex justify-between items-center ${!isNew && (company as Company)?.id === c.id ? 'bg-primary-container border-primary text-on-primary-container' : 'bg-surface hover:bg-surface-container-low border-outline-variant'}`}
                onClick={() => handleSelectCompany(c.id)}
              >
                <div className="flex flex-col truncate">
                  <span className="font-label-lg text-label-lg truncate">{c.name}</span>
                  {activeId === c.id && <span className="text-[10px] uppercase font-bold text-primary mt-1">Active</span>}
                </div>
                {activeId !== c.id && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleSetAsActive(c.id) }}
                    className="text-xs px-2 py-1 bg-surface-variant text-on-surface-variant rounded hover:bg-primary hover:text-on-primary transition-colors"
                    title="Set as Active Dashboard"
                  >
                    Set Active
                  </button>
                )}
              </div>
            ))}
            {isNew && (
              <div className="p-sm rounded-lg border bg-primary-container border-primary text-on-primary-container font-label-lg text-label-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">new_releases</span>
                New Company
              </div>
            )}
          </div>
        </div>

        {/* Company Details Form */}
        <div className="lg:col-span-3 space-y-lg">
          <div className="bg-surface border border-outline-variant rounded-xl p-lg space-y-md">
            <h3 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-sm">
              {isNew ? 'Create New Company' : 'Edit Company Details'}
            </h3>
            
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Company Name *</label>
              <input 
                name="name" 
                value={company.name} 
                onChange={handleChange}
                className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
              />
            </div>

            <div>
              <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Address</label>
              <textarea 
                name="address" 
                value={company.address || ''} 
                onChange={handleChange}
                className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Phone</label>
                <input 
                  name="phone" 
                  value={company.phone || ''} 
                  onChange={handleChange}
                  className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                />
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Email</label>
                <input 
                  type="email"
                  name="email" 
                  value={company.email || ''} 
                  onChange={handleChange}
                  className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">GSTIN *</label>
                <input 
                  name="gstin" 
                  value={company.gstin} 
                  onChange={handleChange}
                  className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface uppercase"
                />
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Base Currency</label>
                <input 
                  name="currency" 
                  value={company.currency} 
                  onChange={handleChange}
                  className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                />
              </div>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant rounded-xl p-lg space-y-md">
            <h3 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-sm">Bank & Payment Details</h3>
            
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Bank Name</label>
              <input 
                name="bank_name" 
                value={company.bank_name || ''} 
                onChange={handleChange}
                className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Account Number</label>
                <input 
                  name="account_number" 
                  value={company.account_number || ''} 
                  onChange={handleChange}
                  className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                />
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">IFSC Code</label>
                <input 
                  name="ifsc_code" 
                  value={company.ifsc_code || ''} 
                  onChange={handleChange}
                  className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface uppercase"
                />
              </div>
            </div>

            <div>
              <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">UPI ID</label>
              <input 
                name="upi_id" 
                value={company.upi_id || ''} 
                onChange={handleChange}
                className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
              />
            </div>
          </div>

          <div className="bg-surface border border-outline-variant rounded-xl p-lg space-y-md">
            <h3 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-sm">Email Setup (SMTP)</h3>
            <p className="font-body-sm text-on-surface-variant">Enter your email and App Password to automatically send invoices.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">SMTP Host</label>
                <input 
                  name="smtp_host" 
                  value={company.smtp_host || ''} 
                  onChange={handleChange}
                  placeholder="smtp.gmail.com"
                  className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                />
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">SMTP Port</label>
                <input 
                  type="number"
                  name="smtp_port" 
                  value={company.smtp_port || 587} 
                  onChange={(e) => { if(company) setCompany({ ...company, smtp_port: parseInt(e.target.value) || 587 }) }}
                  className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Email Address (SMTP User)</label>
                <input 
                  type="email"
                  name="smtp_user" 
                  value={company.smtp_user || ''} 
                  onChange={handleChange}
                  placeholder="your-email@gmail.com"
                  className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                />
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">App Password (SMTP Password)</label>
                <input 
                  type="password"
                  name="smtp_pass" 
                  value={company.smtp_pass || ''} 
                  onChange={handleChange}
                  placeholder="16-digit App Password"
                  className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
