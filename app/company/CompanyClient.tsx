'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { setActiveCompany } from '@/app/actions/company'

type Company = {
  id: string
  name: string
  logo_base64: string | null
  address: string | null
  mobile: string | null
  email: string | null
  gstin: string | null
  smtp_host: string | null
  smtp_port: number | null
  smtp_user: string | null
  smtp_pass: string | null
  bank_name: string | null
  account_name: string | null
  account_number: string | null
  ifsc_code: string | null
  branch: string | null
  upi_id: string | null
  services_list: string | null
  template_base64: string | null
}

const emptyCompany: Omit<Company, 'id'> = {
  name: '',
  logo_base64: null,
  address: '',
  mobile: '',
  email: '',
  gstin: '',
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_user: '',
  smtp_pass: '',
  bank_name: '',
  account_name: '',
  account_number: '',
  ifsc_code: '',
  branch: '',
  upi_id: '',
  services_list: '',
  template_base64: null
}

export default function CompanyClient({ 
  initialCompanies, 
  initialActiveId 
}: { 
  initialCompanies: Company[], 
  initialActiveId: string | null 
}) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies)
  const [activeId, setActiveId] = useState<string | null>(initialActiveId)
  
  const initialCompanyToEdit = initialActiveId 
    ? initialCompanies.find((c) => c.id === initialActiveId) || initialCompanies[0] 
    : (initialCompanies.length > 0 ? initialCompanies[0] : null)
    
  const [company, setCompany] = useState<Company | Omit<Company, 'id'> | null>(initialCompanyToEdit || { ...emptyCompany })
  const [isNew, setIsNew] = useState(initialCompanies.length === 0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const templateInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const refreshData = async () => {
    try {
      const res = await fetch('/api/company')
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && company) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCompany({ ...company, logo_base64: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && company) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCompany({ ...company, template_base64: reader.result as string })
      }
      reader.readAsDataURL(file)
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company? All related data (invoices, customers, items) will also be deleted!')) return
    try {
      await fetch(`/api/company/${id}`, { method: 'DELETE' })
      if (activeId === id) {
        await setActiveCompany('')
        setActiveId(null)
      }
      await refreshData()
      setIsNew(true)
      setCompany({ ...emptyCompany })
    } catch (error) {
      console.error(error)
      alert('Failed to delete company')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return
    if (!company.name) {
      alert('Company Name is required.')
      return
    }

    try {
      if (isNew) {
        const res = await fetch('/api/company', {
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
        await fetch(`/api/company/${c.id}`, {
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
          <h2 className="font-headline-lg text-headline-lg md:font-headline-lg md:text-headline-lg font-headline-lg-mobile text-headline-lg-mobile text-primary font-['Aclonica']">Company Setup</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Manage your business profile, logo, and email server.</p>
        </div>
        <div className="flex gap-sm w-full sm:w-auto">
          <button 
            onClick={handleAddNew}
            className="w-full sm:w-auto px-md py-sm bg-surface-variant text-on-surface-variant font-label-md text-label-md rounded-lg hover:bg-outline-variant transition-colors flex items-center justify-center gap-xs shadow-sm border border-outline-variant"
          >
            <span className="material-symbols-outlined text-[18px]">add_business</span>
            Add New Company
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-lg">
        {/* Sidebar for multiple companies */}
        <div className="bg-surface border border-outline-variant rounded-xl p-md space-y-sm h-fit shadow-sm backdrop-blur-xl bg-opacity-80">
          <h3 className="font-headline-sm text-headline-sm text-primary px-sm pb-sm border-b border-outline-variant font-['Aclonica']">Your Companies</h3>
          <div className="flex flex-col gap-xs pt-sm">
            {companies.map(c => (
              <div 
                key={c.id} 
                className={`p-sm rounded-lg border cursor-pointer transition-colors flex justify-between items-center ${!isNew && (company as Company)?.id === c.id ? 'bg-primary-container border-primary text-on-primary-container shadow-md' : 'bg-surface hover:bg-surface-container-low border-outline-variant'}`}
                onClick={() => handleSelectCompany(c.id)}
              >
                <div className="flex flex-col truncate pr-2">
                  <span className="font-label-lg text-label-lg truncate">{c.name}</span>
                  {activeId === c.id && <span className="text-[10px] uppercase font-bold text-primary mt-1 tracking-wider">Active</span>}
                </div>
                {activeId !== c.id && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleSetAsActive(c.id) }}
                    className="text-xs px-2 py-1 bg-surface-variant text-on-surface-variant rounded hover:bg-primary hover:text-on-primary transition-colors whitespace-nowrap border border-outline-variant"
                    title="Set as Active Dashboard"
                  >
                    Set Active
                  </button>
                )}
              </div>
            ))}
            {isNew && (
              <div className="p-sm rounded-lg border bg-primary-container border-primary text-on-primary-container font-label-lg text-label-lg flex items-center gap-2 shadow-md">
                <span className="material-symbols-outlined text-[18px]">new_releases</span>
                New Company
              </div>
            )}
          </div>
        </div>

        {/* Company Details Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="space-y-lg">
            
            {/* Basic Info */}
            <div className="bg-surface border border-outline-variant rounded-xl p-lg space-y-md shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-tertiary"></div>
              <div className="flex justify-between items-center border-b border-outline-variant pb-sm">
                <h3 className="font-headline-md text-headline-md text-primary font-['Aclonica']">
                  {isNew ? 'Create New Company' : 'Edit Company Details'}
                </h3>
                {!isNew && (
                  <button type="button" onClick={() => handleDelete((company as Company).id)} className="text-error hover:bg-error-container p-2 rounded-lg flex items-center gap-1 text-sm border border-transparent hover:border-error">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Delete
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-xl items-start">
                {/* Logo Section */}
                <div className="flex flex-col items-center justify-center p-md border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {company.logo_base64 ? (
                    <img src={company.logo_base64} alt="Logo Preview" className="h-24 object-contain mb-sm rounded" />
                  ) : (
                    <div className="h-24 flex flex-col items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl mb-2">add_photo_alternate</span>
                      <span className="font-label-sm">Upload PNG/JPEG</span>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} />
                  <span className="text-xs text-primary font-medium bg-primary-container px-3 py-1 rounded-full mt-2">Change Logo</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Company Name *</label>
                    <input required name="name" value={company.name} onChange={handleChange} className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner" placeholder="e.g. Acme Corp" />
                  </div>
                  <div>
                    <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">GSTIN Number</label>
                    <input name="gstin" value={company.gstin || ''} onChange={handleChange} className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none uppercase transition-all shadow-inner" placeholder="22AAAAA0000A1Z5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Registered Address</label>
                <textarea name="address" value={company.address || ''} onChange={handleChange} className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none min-h-[80px] transition-all shadow-inner" placeholder="Full address..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Mobile Number</label>
                  <input name="mobile" value={company.mobile || ''} onChange={handleChange} className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner" placeholder="+91 9999999999" />
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Business Email</label>
                  <input type="email" name="email" value={company.email || ''} onChange={handleChange} className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner" placeholder="contact@acme.com" />
                </div>
              </div>
            </div>

            {/* Email / SMTP Setup */}
            <div className="bg-surface border border-outline-variant rounded-xl p-lg space-y-md shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-primary"></div>
              <h3 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-sm font-['Aclonica']">Email Automation Setup</h3>
              <p className="font-body-sm text-on-surface-variant bg-surface-variant/30 p-sm rounded border border-outline-variant/50 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">info</span>
                To send invoice PDFs automatically, enter your SMTP details (e.g. Gmail App Password).
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">SMTP Host</label>
                  <input name="smtp_host" value={company.smtp_host || ''} onChange={handleChange} placeholder="smtp.gmail.com" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-inner" />
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">SMTP Port</label>
                  <input type="number" name="smtp_port" value={company.smtp_port || 587} onChange={(e) => { if(company) setCompany({ ...company, smtp_port: parseInt(e.target.value) || 587 }) }} className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-inner" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Email Address (Sender)</label>
                  <input type="email" name="smtp_user" value={company.smtp_user || ''} onChange={handleChange} placeholder="your-email@gmail.com" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-inner" />
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">App Password</label>
                  <input type="password" name="smtp_pass" value={company.smtp_pass || ''} onChange={handleChange} placeholder="16-digit App Password" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-inner" />
                </div>
              </div>
            </div>

            {/* Bank & PDF Details */}
            <div className="bg-surface border border-outline-variant rounded-xl p-lg space-y-md shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tertiary to-secondary"></div>
              <h3 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-sm font-['Aclonica']">Bank Details & Custom PDF Template</h3>
              <p className="font-body-sm text-on-surface-variant bg-surface-variant/30 p-sm rounded border border-outline-variant/50 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[20px]">account_balance</span>
                These details will be automatically printed on your generated PDF invoices.
              </p>

              {/* Template Background Image Uploader */}
              <div className="flex flex-col items-center justify-center p-md border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer mb-md" onClick={() => templateInputRef.current?.click()}>
                  {company.template_base64 ? (
                    <img src={company.template_base64} alt="Template Preview" className="h-32 object-contain mb-sm rounded" />
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl mb-2">wallpaper</span>
                      <span className="font-label-sm block text-center mb-1">Upload Blank PDF Template Background</span>
                      <span className="text-xs">A4 format (PNG/JPEG) recommended</span>
                    </div>
                  )}
                  <input type="file" ref={templateInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleTemplateChange} />
                  <span className="text-xs text-primary font-medium bg-primary-container px-3 py-1 rounded-full mt-2">Change Template Image</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Bank Name</label>
                  <input name="bank_name" value={company.bank_name || ''} onChange={handleChange} placeholder="e.g. State Bank of India" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-inner" />
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Account Name</label>
                  <input name="account_name" value={company.account_name || ''} onChange={handleChange} placeholder="e.g. FUSION ENTERPRISE" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-inner" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Account Number</label>
                  <input name="account_number" value={company.account_number || ''} onChange={handleChange} placeholder="A/C No." className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-inner" />
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">IFSC Code</label>
                  <input name="ifsc_code" value={company.ifsc_code || ''} onChange={handleChange} placeholder="SBIN0000" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-inner" />
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Branch</label>
                  <input name="branch" value={company.branch || ''} onChange={handleChange} placeholder="e.g. BIL" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-inner" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">UPI ID (For QR Code)</label>
                  <input name="upi_id" value={company.upi_id || ''} onChange={handleChange} placeholder="merchant@upi" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-inner" />
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Footer Services List (Optional)</label>
                  <input name="services_list" value={company.services_list || ''} onChange={handleChange} placeholder="e.g. Event Organizer | Printing Goods" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-inner" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-sm pb-xl">
              <button type="submit" className="px-xl py-md bg-primary text-on-primary font-label-lg text-label-lg rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center justify-center gap-sm shadow-md hover:shadow-lg">
                <span className="material-symbols-outlined text-[20px]">save</span>
                Save Company
              </button>
            </div>

          </form>
        </div>
      </div>
    </main>
  )
}
