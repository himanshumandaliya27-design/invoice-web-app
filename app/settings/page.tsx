'use client'

import { useState, useEffect } from 'react'

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
}

export default function SettingsPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch('/api/companies')
        const data = await res.json()
        if (data.length > 0) setCompany(data[0])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchCompany()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (company) {
      setCompany({ ...company, [e.target.name]: e.target.value })
    }
  }

  const handleSave = async () => {
    if (!company) return
    try {
      await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company)
      })
      alert('Settings saved successfully!')
    } catch (error) {
      console.error(error)
      alert('Failed to save settings')
    }
  }

  if (loading) return <div className="p-xl text-center text-on-surface-variant">Loading settings...</div>
  if (!company) return <div className="p-xl text-center text-on-surface-variant">No company found.</div>

  return (
    <main className="flex-1 p-lg lg:p-xl max-w-container-max mx-auto w-full space-y-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg md:font-headline-lg md:text-headline-lg font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Settings</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Update your company details and bank information.</p>
        </div>
        <button 
          onClick={handleSave}
          className="w-full sm:w-auto px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-colors flex items-center justify-center gap-xs"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Company Details */}
        <div className="bg-surface border border-outline-variant rounded-xl p-lg space-y-md">
          <h3 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-sm">Company Details</h3>
          
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">Company Name</label>
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
              onChange={handleChange as any}
              className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-md">
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

          <div>
            <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">GSTIN</label>
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

        {/* Banking Details */}
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
      </div>
    </main>
  )
}
