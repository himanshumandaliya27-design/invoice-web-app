'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Customer = { id: string, name: string, address: string | null, gstin: string | null }
type Item = { id: string, name: string, hsn_sac: string | null, price: number, tax_rate: number }
type Company = { name: string, address: string | null, gstin: string | null }

type InvoiceItemInput = {
  item_id: string
  item_name: string
  hsn_sac: string
  quantity: number
  rate: number
  tax_rate: number
  total_amount: number
}

export default function NewInvoiceClient({ 
  customers, 
  items, 
  nextInvoiceNumber,
  company
}: { 
  customers: Customer[]
  items: Item[]
  nextInvoiceNumber: string
  company: Company | null
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState(nextInvoiceNumber)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemInput[]>([])
  
  const [notes, setNotes] = useState('Thank you for your business!')
  const [terms, setTerms] = useState('Payment is due within 15 days.')

  const handleCustomerChange = (id: string) => {
    setCustomerId(id)
    setSelectedCustomer(customers.find(c => c.id === id) || null)
  }

  const handleAddItem = (itemId: string) => {
    if (!itemId) return
    const item = items.find(i => i.id === itemId)
    if (!item) return
    
    setInvoiceItems([...invoiceItems, {
      item_id: item.id,
      item_name: item.name,
      hsn_sac: item.hsn_sac || '',
      quantity: 1,
      rate: item.price,
      tax_rate: item.tax_rate,
      total_amount: item.price + (item.price * item.tax_rate / 100)
    }])
  }

  const updateInvoiceItem = (index: number, field: keyof InvoiceItemInput, value: number) => {
    const newItems = [...invoiceItems]
    const item = newItems[index]
    
    if (field === 'quantity') item.quantity = value
    if (field === 'rate') item.rate = value
    if (field === 'tax_rate') item.tax_rate = value
    
    const baseAmount = item.quantity * item.rate
    item.total_amount = baseAmount + (baseAmount * item.tax_rate / 100)
    
    setInvoiceItems(newItems)
  }

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index))
  }

  const subTotal = invoiceItems.reduce((acc, curr) => acc + (curr.quantity * curr.rate), 0)
  const taxTotal = invoiceItems.reduce((acc, curr) => acc + ((curr.quantity * curr.rate) * curr.tax_rate / 100), 0)
  const grandTotal = subTotal + taxTotal

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) return alert('Please select a customer')
    if (invoiceItems.length === 0) return alert('Please add at least one item')

    setSubmitting(true)
    try {
      const payload = {
        invoice_number: invoiceNumber,
        date,
        due_date: dueDate || null,
        status: 'DRAFT',
        customer_id: customerId,
        sub_total: subTotal,
        tax_total: taxTotal,
        grand_total: grandTotal,
        notes,
        terms,
        items: invoiceItems
      }

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        alert('Invoice created successfully!')
        router.push('/invoices')
      } else {
        const err = await res.json()
        alert(`Error: ${err.error}`)
      }
    } catch (error) {
      console.error(error)
      alert('Failed to create invoice')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex-1 p-lg lg:p-xl max-w-container-max mx-auto w-full space-y-xl">
      <div className="flex items-center gap-sm">
        <Link href="/invoices" className="text-on-surface-variant hover:text-primary transition-colors flex items-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h2 className="font-headline-lg text-headline-lg md:font-headline-lg md:text-headline-lg font-headline-lg-mobile text-headline-lg-mobile text-primary font-['Aclonica']">Create Invoice</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-outline-variant rounded-xl p-lg space-y-xl shadow-sm">
        
        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl border-b border-outline-variant pb-xl">
          <div className="space-y-md">
            <h3 className="font-headline-sm text-headline-sm text-primary font-['Aclonica']">Billed From</h3>
            {company ? (
              <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
                <p className="font-label-lg text-label-lg">{company.name}</p>
                <p className="font-body-sm text-on-surface-variant whitespace-pre-line mt-1">{company.address}</p>
                {company.gstin && <p className="font-body-sm text-on-surface-variant mt-1">GSTIN: <span className="uppercase">{company.gstin}</span></p>}
              </div>
            ) : (
              <div className="text-error font-label-md text-label-md bg-error-container p-sm rounded border border-error">Please set up your Company details first.</div>
            )}
            
            <h3 className="font-headline-sm text-headline-sm text-primary font-['Aclonica'] mt-lg pt-sm border-t border-outline-variant">Billed To</h3>
            <div>
              <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Select Customer *</label>
              <select required className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={customerId} onChange={e => handleCustomerChange(e.target.value)}>
                <option value="">-- Select Customer --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {selectedCustomer && (
              <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
                <p className="font-label-lg text-label-lg">{selectedCustomer.name}</p>
                <p className="font-body-sm text-on-surface-variant whitespace-pre-line mt-1">{selectedCustomer.address}</p>
                {selectedCustomer.gstin && <p className="font-body-sm text-on-surface-variant mt-1">GSTIN: <span className="uppercase">{selectedCustomer.gstin}</span></p>}
              </div>
            )}
          </div>

          <div className="space-y-md bg-surface-container-lowest p-lg border border-outline-variant rounded-xl h-fit">
            <h3 className="font-headline-sm text-headline-sm text-primary font-['Aclonica'] border-b border-outline-variant pb-xs">Invoice Details</h3>
            <div>
              <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Invoice Number *</label>
              <input required type="text" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none font-bold text-primary" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Invoice Date *</label>
                <input required type="date" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Due Date</label>
                <input type="date" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="space-y-md border-b border-outline-variant pb-xl">
          <div className="flex justify-between items-end">
            <h3 className="font-headline-sm text-headline-sm text-primary font-['Aclonica']">Invoice Items</h3>
            <div className="w-64">
              <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs text-right">Quick Add Item</label>
              <select className="w-full px-md py-sm bg-surface-container border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-primary font-bold shadow-sm" onChange={e => { handleAddItem(e.target.value); e.target.value = '' }}>
                <option value="">+ Select Item to Add</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} - ₹{i.price}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-surface-bright border-b border-outline-variant">
                  <th className="font-label-md text-label-md text-on-surface-variant py-md px-md">Item Name</th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-md px-md w-24">Qty</th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-md px-md w-32">Rate (₹)</th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-md px-md w-24">GST %</th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-md px-md w-32">Total (₹)</th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-md px-md w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {invoiceItems.length === 0 ? (
                  <tr><td colSpan={6} className="py-xl text-center text-on-surface-variant">No items added yet.</td></tr>
                ) : (
                  invoiceItems.map((item, index) => (
                    <tr key={index} className="hover:bg-surface-container-low">
                      <td className="py-md px-md">
                        <div className="font-medium text-primary">{item.item_name}</div>
                        {item.hsn_sac && <div className="text-xs text-on-surface-variant uppercase mt-1">HSN: {item.hsn_sac}</div>}
                      </td>
                      <td className="py-md px-md">
                        <input type="number" min="1" className="w-full p-2 bg-surface border border-outline-variant rounded" value={item.quantity} onChange={e => updateInvoiceItem(index, 'quantity', Number(e.target.value))} />
                      </td>
                      <td className="py-md px-md">
                        <input type="number" step="0.01" className="w-full p-2 bg-surface border border-outline-variant rounded" value={item.rate} onChange={e => updateInvoiceItem(index, 'rate', Number(e.target.value))} />
                      </td>
                      <td className="py-md px-md">
                        <input type="number" step="0.01" className="w-full p-2 bg-surface border border-outline-variant rounded" value={item.tax_rate} onChange={e => updateInvoiceItem(index, 'tax_rate', Number(e.target.value))} />
                      </td>
                      <td className="py-md px-md font-medium text-on-surface">
                        ₹{item.total_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                      </td>
                      <td className="py-md px-md text-right">
                        <button type="button" onClick={() => removeInvoiceItem(index)} className="text-error p-1 hover:bg-error-container rounded">
                          <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Totals & Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
          <div className="space-y-md">
            <div>
              <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Notes / Remarks</label>
              <textarea className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary outline-none min-h-[60px]" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div>
              <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Terms & Conditions</label>
              <textarea className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary outline-none min-h-[60px]" value={terms} onChange={e => setTerms(e.target.value)} />
            </div>
          </div>
          <div className="bg-surface-container-lowest p-lg border border-outline-variant rounded-xl shadow-sm space-y-sm">
            <h3 className="font-headline-sm text-headline-sm text-primary font-['Aclonica'] border-b border-outline-variant pb-xs mb-md">Summary</h3>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Subtotal</span>
              <span>₹{subTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Tax (GST)</span>
              <span>₹{taxTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-lg pt-sm border-t border-outline-variant mt-sm text-primary">
              <span>Grand Total</span>
              <span>₹{grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="pt-lg flex justify-end">
               <button type="submit" disabled={submitting || !customerId || invoiceItems.length === 0} className="w-full px-xl py-md bg-primary text-on-primary font-label-lg text-label-lg rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-sm">
                  <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                  {submitting ? 'Creating...' : 'Save & Create Invoice'}
               </button>
            </div>
          </div>
        </div>
      </form>
    </main>
  )
}
