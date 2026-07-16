'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { calculateTaxes, numberToWords } from '@/lib/invoice-utils'

export default function NewInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [company, setCompany] = useState<any>(null)
  
  // Pure UI Fields
  const [customerType, setCustomerType] = useState('B2B (Registered)')
  const [poNumber, setPoNumber] = useState('')

  const [formData, setFormData] = useState({
    customer_id: '',
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    place_of_supply: '',
    notes: '',
    terms_conditions: '1. Payment is due within 30 days.\n2. Please include invoice number on your check.',
    items: [] as any[]
  })

  // Modal State for Add Customer
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', gstin: '', address: '', state: '' })
  const [customerSubmitting, setCustomerSubmitting] = useState(false)

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers')
      const data = await res.json()
      setCustomers(data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    Promise.all([
      fetchCustomers(),
      fetch('/api/products').then(res => res.json()),
      fetch('/api/companies').then(res => res.json())
    ]).then(([_, productsData, companiesData]) => {
      setProducts(productsData)
      if (companiesData.length > 0) {
        setCompany(companiesData[0])
      }
      setLoading(false)
    })
  }, [])

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setCustomerSubmitting(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      })
      if (res.ok) {
        const addedCust = await res.json()
        setIsCustomerModalOpen(false)
        setNewCustomer({ name: '', email: '', phone: '', gstin: '', address: '', state: '' })
        await fetchCustomers()
        setFormData(prev => ({ ...prev, customer_id: addedCust.id }))
      } else {
        alert('Failed to add customer')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setCustomerSubmitting(false)
    }
  }

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 1, rate: 0, tax_rate: 0, _tempName: '', _tempHsn: '', _tempDesc: '' }]
    })
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items]
    newItems.splice(index, 1)
    setFormData({ ...formData, items: newItems })
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === value)
      if (product) {
        newItems[index] = {
          ...newItems[index],
          product_id: product.id,
          rate: product.price,
          tax_rate: product.tax_rate,
          _tempName: product.name,
          _tempHsn: product.hsn_sac_code || '',
          _tempDesc: product.description || ''
        }
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value }
    }
    
    setFormData({ ...formData, items: newItems })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) {
      alert('Please set up a company first in Settings.')
      return
    }
    if (formData.items.length === 0) {
      alert('Please add at least one item.')
      return
    }
    
    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        company_id: company.id,
      }
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        router.push('/invoices')
      } else {
        const error = await res.json()
        alert('Failed to create invoice: ' + error.error)
      }
    } catch (error) {
      console.error(error)
      alert('An error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCustomer = customers.find(c => c.id === formData.customer_id)
  
  // Live calculations
  const companyStateCode = company?.gstin ? company.gstin.substring(0, 2) : '27'
  const customerStateCode = formData.place_of_supply ? formData.place_of_supply.substring(0, 2) : (selectedCustomer?.state ? selectedCustomer.state.substring(0, 2) : (selectedCustomer?.gstin ? selectedCustomer.gstin.substring(0, 2) : '27'))
  
  const taxSummary = useMemo(() => {
    return calculateTaxes(formData.items, companyStateCode, customerStateCode)
  }, [formData.items, companyStateCode, customerStateCode])

  const totalInWords = useMemo(() => {
    return numberToWords(taxSummary.grand_total)
  }, [taxSummary.grand_total])

  if (loading) return <div className="p-xl text-center text-on-surface-variant">Loading...</div>

  return (
    <main className="flex-1 overflow-y-auto p-lg lg:p-[40px] bg-background relative">
      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface rounded-xl p-lg w-full max-w-[448px] shadow-lg">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">Add New Customer</h3>
            <form onSubmit={handleAddCustomer} className="space-y-sm">
              <div>
                <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Name *</label>
                <input required type="text" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
              </div>
              <div>
                <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Email</label>
                <input type="email" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
              </div>
              <div>
                <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Phone</label>
                <input type="text" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
              </div>
              <div>
                <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">GSTIN</label>
                <input type="text" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newCustomer.gstin} onChange={e => setNewCustomer({...newCustomer, gstin: e.target.value})} />
              </div>
              <div>
                <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">State</label>
                <input type="text" placeholder="e.g. 27-Maharashtra" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newCustomer.state} onChange={e => setNewCustomer({...newCustomer, state: e.target.value})} />
              </div>
              <div>
                <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Address</label>
                <input type="text" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
              </div>
              <div className="flex justify-end gap-sm mt-lg pt-sm">
                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="px-md py-sm text-primary font-label-md text-label-md hover:bg-surface-container rounded-lg">Cancel</button>
                <button type="submit" disabled={customerSubmitting} className="px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container disabled:opacity-50">{customerSubmitting ? 'Saving...' : 'Save Customer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-container-max mx-auto space-y-gutter pb-xl">
        {/* Page Title */}
        <div className="flex justify-between items-end border-b border-outline-variant pb-md">
          <div className="flex items-center gap-md">
            <Link href="/invoices" className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </Link>
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">New Invoice</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Create a GST compliant B2B or B2C invoice.</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center bg-surface-container-lowest text-on-surface-variant px-sm py-xs rounded border border-outline-variant">
              <span className="w-2 h-2 rounded-full bg-secondary mr-sm"></span>
              <span className="font-label-md text-label-md uppercase">Draft</span>
            </div>
          </div>
        </div>

        {/* Main Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-gutter">
            {/* Customer Details Card */}
            <div className="bg-surface-container-lowest rounded border border-outline-variant p-lg shadow-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface pb-sm mb-md border-b border-outline-variant">Billed To</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-md">
                <div className="flex flex-col">
                  <label className="font-label-md text-label-md text-on-surface-variant mb-xs uppercase">Customer Type</label>
                  <select 
                    className="w-full p-sm rounded border border-outline-variant bg-transparent font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    value={customerType}
                    onChange={e => setCustomerType(e.target.value)}
                  >
                    <option>B2B (Registered)</option>
                    <option>B2C (Unregistered)</option>
                    <option>Export</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-xs">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase">Select Customer *</label>
                    <button type="button" onClick={() => setIsCustomerModalOpen(true)} className="text-primary font-label-md text-[10px] hover:underline">+ Add New</button>
                  </div>
                  <div className="relative">
                    <select 
                      required
                      className="w-full p-sm pl-sm pr-xl rounded border border-outline-variant bg-transparent font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none"
                      value={formData.customer_id}
                      onChange={e => setFormData({...formData, customer_id: e.target.value})}
                    >
                      <option value="">Select a customer</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 pointer-events-none text-outline">arrow_drop_down</span>
                  </div>
                </div>
              </div>

              {selectedCustomer && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                  <div className="p-md bg-surface-container-low rounded border border-outline-variant flex flex-col">
                    <div className="flex justify-between items-center mb-sm">
                      <span className="font-label-md text-label-md text-on-surface uppercase">Billing Details</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-md flex-1">
                      <strong className="text-on-surface">{selectedCustomer.name}</strong><br/>
                      {selectedCustomer.email && <>{selectedCustomer.email}<br/></>}
                      {selectedCustomer.phone && <>{selectedCustomer.phone}<br/></>}
                      {selectedCustomer.address && <>{selectedCustomer.address}</>}
                    </p>
                    <div className="border-t border-outline-variant pt-sm mt-auto">
                      <p className="font-label-md text-label-md text-on-surface">GSTIN: <span className="text-primary font-bold">{selectedCustomer.gstin || 'N/A'}</span></p>
                      <p className="font-label-md text-label-md text-on-surface-variant mt-xs">Place of Supply: {selectedCustomer.state || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="p-md bg-surface-container-low rounded border border-outline-variant flex flex-col">
                    <div className="flex justify-between items-center mb-sm">
                      <span className="font-label-md text-label-md text-on-surface uppercase">Shipping Address</span>
                      <div className="flex items-center gap-xs">
                        <input type="checkbox" id="same_as_billing" defaultChecked className="rounded border-outline-variant text-primary focus:ring-primary"/>
                        <label htmlFor="same_as_billing" className="font-label-md text-[10px] text-on-surface-variant cursor-pointer">Same as Billing</label>
                      </div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant opacity-80 flex-1">
                      <strong className="text-on-surface">{selectedCustomer.name}</strong><br/>
                      {selectedCustomer.address || 'Address not provided'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="bg-surface-container-lowest rounded border border-outline-variant shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-table-data text-table-data border-collapse min-w-[800px]">
                  <thead className="bg-surface-bright border-b border-outline-variant font-label-md text-label-md uppercase text-on-surface-variant">
                    <tr>
                      <th className="p-sm font-semibold w-12 text-center border-r border-outline-variant">#</th>
                      <th className="p-sm font-semibold border-r border-outline-variant">Product / Service</th>
                      <th className="p-sm font-semibold w-24 border-r border-outline-variant">HSN/SAC</th>
                      <th className="p-sm font-semibold w-20 text-right border-r border-outline-variant">Qty</th>
                      <th className="p-sm font-semibold w-32 text-right border-r border-outline-variant">Rate (₹)</th>
                      <th className="p-sm font-semibold w-24 text-right border-r border-outline-variant">GST %</th>
                      <th className="p-sm font-semibold w-36 text-right">Amount (₹)</th>
                      <th className="p-sm w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="text-on-surface">
                    {formData.items.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-xl text-center text-on-surface-variant">No items added.</td>
                      </tr>
                    )}
                    {formData.items.map((item, index) => {
                      const taxObj = taxSummary.calculatedItems[index]
                      return (
                      <tr key={index} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group">
                        <td className="p-sm text-center text-on-surface-variant border-r border-outline-variant">{index + 1}</td>
                        <td className="p-sm border-r border-outline-variant">
                          <select 
                            className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded p-1 mb-1 font-semibold appearance-none"
                            value={item.product_id}
                            onChange={e => handleItemChange(index, 'product_id', e.target.value)}
                            required
                          >
                            <option value="">Select product...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <input 
                            type="text" 
                            className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded p-1 text-[12px] text-on-surface-variant" 
                            placeholder="Description (optional)" 
                            value={item._tempDesc || ''}
                            onChange={e => handleItemChange(index, '_tempDesc', e.target.value)}
                          />
                        </td>
                        <td className="p-sm border-r border-outline-variant">
                          <input 
                            type="text" 
                            className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded p-1" 
                            placeholder="Code" 
                            value={item._tempHsn || ''}
                            onChange={e => handleItemChange(index, '_tempHsn', e.target.value)}
                          />
                        </td>
                        <td className="p-sm border-r border-outline-variant">
                          <input 
                            type="number" min="1" step="0.01"
                            className="w-full text-right bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded p-1" 
                            placeholder="0" 
                            value={item.quantity}
                            onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="p-sm border-r border-outline-variant">
                          <input 
                            type="number" min="0" step="0.01"
                            className="w-full text-right bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded p-1" 
                            placeholder="0.00" 
                            value={item.rate}
                            onChange={e => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="p-sm border-r border-outline-variant">
                          <input 
                            type="number" min="0" step="0.01" max="100"
                            className="w-full text-right bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded p-1" 
                            placeholder="0%" 
                            value={item.tax_rate}
                            onChange={e => handleItemChange(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="p-sm text-right font-semibold">
                          {(taxObj?.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-sm text-center">
                          <button type="button" onClick={() => handleRemoveItem(index)} className="text-outline hover:text-error opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
              <div className="p-sm border-t border-outline-variant bg-surface-bright flex justify-between items-center">
                <button type="button" onClick={handleAddItem} className="flex items-center text-primary font-label-md text-label-md hover:bg-surface-container-low px-sm py-xs rounded transition-colors">
                  <span className="material-symbols-outlined text-[18px] mr-xs">add</span> Add Line Item
                </button>
              </div>
            </div>

            {/* Footer Notes */}
            <div className="w-full space-y-md">
              <div className="flex flex-col">
                <label className="font-label-md text-label-md text-on-surface-variant mb-xs uppercase">Notes to Customer</label>
                <textarea 
                  className="w-full p-sm rounded border border-outline-variant bg-surface-container-lowest font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none h-24" 
                  placeholder="Enter any additional notes for the customer here..."
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
              <div className="flex flex-col">
                <label className="font-label-md text-label-md text-on-surface-variant mb-xs uppercase">Terms & Conditions</label>
                <textarea 
                  className="w-full p-sm rounded border border-outline-variant bg-surface-container-lowest font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none h-24" 
                  value={formData.terms_conditions}
                  onChange={e => setFormData({...formData, terms_conditions: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Right Column (4 cols) */}
          <div className="lg:col-span-4 space-y-gutter">
            {/* Invoice Meta Card */}
            <div className="bg-surface-container-lowest rounded border border-outline-variant p-lg shadow-sm">
              <div className="space-y-md">
                <div className="flex flex-col">
                  <label className="font-label-md text-label-md text-on-surface-variant mb-xs uppercase">Invoice Number</label>
                  <div className="flex items-center">
                    <span className="p-sm bg-surface-container-low border border-outline-variant rounded text-on-surface-variant font-body-sm w-full">
                      Auto-generated on Save
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-sm">
                  <div className="flex flex-col">
                    <label className="font-label-md text-label-md text-on-surface-variant mb-xs uppercase">Issue Date *</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        required
                        className="w-full p-sm rounded border border-outline-variant bg-transparent font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none" 
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="font-label-md text-label-md text-on-surface-variant mb-xs uppercase">Due Date</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        className="w-full p-sm rounded border border-outline-variant bg-transparent font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none" 
                        value={formData.due_date}
                        onChange={e => setFormData({...formData, due_date: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="font-label-md text-label-md text-on-surface-variant mb-xs uppercase">PO Number (Optional)</label>
                  <input 
                    type="text" 
                    className="w-full p-sm rounded border border-outline-variant bg-transparent font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                    placeholder="PO-XXXX"
                    value={poNumber}
                    onChange={e => setPoNumber(e.target.value)}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-md text-label-md text-on-surface-variant mb-xs uppercase">Place of Supply (Override)</label>
                  <input 
                    type="text" 
                    className="w-full p-sm rounded border border-outline-variant bg-transparent font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                    placeholder="e.g. 27-Maharashtra"
                    value={formData.place_of_supply}
                    onChange={e => setFormData({...formData, place_of_supply: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-surface-container-lowest rounded border border-outline-variant p-lg shadow-sm sticky top-24">
              <h3 className="font-headline-md text-headline-md text-on-surface pb-sm mb-md border-b border-outline-variant">Summary</h3>
              <div className="space-y-sm font-body-sm text-on-surface mb-lg">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Sub-Total</span>
                  <span className="font-semibold">₹ {taxSummary.sub_total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-outline-variant my-sm pt-sm space-y-xs">
                  {companyStateCode === customerStateCode ? (
                    <>
                      <div className="flex justify-between items-center text-[12px]">
                        <span className="text-on-surface-variant">CGST</span>
                        <span>₹ {(taxSummary.tax_total / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-[12px]">
                        <span className="text-on-surface-variant">SGST</span>
                        <span>₹ {(taxSummary.tax_total / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-[12px] opacity-50">
                        <span className="text-on-surface-variant">IGST</span>
                        <span>₹ 0.00</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-[12px] opacity-50">
                        <span className="text-on-surface-variant">CGST</span>
                        <span>₹ 0.00</span>
                      </div>
                      <div className="flex justify-between items-center text-[12px] opacity-50">
                        <span className="text-on-surface-variant">SGST</span>
                        <span>₹ 0.00</span>
                      </div>
                      <div className="flex justify-between items-center text-[12px]">
                        <span className="text-on-surface-variant">IGST</span>
                        <span>₹ {taxSummary.tax_total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-between items-center border-t border-outline-variant pt-md mt-md">
                  <span className="font-headline-md text-headline-md font-bold text-on-surface">Total Amount</span>
                  <span className="font-headline-md text-headline-md font-black text-primary">₹ {taxSummary.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {taxSummary.grand_total > 0 && totalInWords && (
                  <div className="text-right font-label-md text-on-surface-variant mt-xs uppercase">
                    {totalInWords} Rupees Only
                  </div>
                )}
              </div>
              <div className="space-y-sm pt-md border-t border-outline-variant">
                <button type="button" className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant py-sm px-md rounded font-label-md hover:bg-surface-container-low transition-colors duration-200 flex items-center justify-center">
                  Save Draft
                </button>
                <button type="button" className="w-full bg-surface-container-low text-secondary border border-outline-variant py-sm px-md rounded font-label-md hover:bg-surface-variant transition-colors duration-200 flex items-center justify-center">
                  Preview PDF
                </button>
                <button 
                  type="button" 
                  onClick={handleSubmit} 
                  disabled={submitting} 
                  className="w-full bg-primary text-on-primary py-sm px-md rounded font-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors duration-200 flex items-center justify-center shadow-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px] mr-xs">save</span>
                  {submitting ? 'Saving...' : 'Save & Generate Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
