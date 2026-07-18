'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { generateInvoicePDF } from '@/lib/generate-pdf-client'

export default function InvoiceDetailsPage() {
  const params = useParams()
  const id = params.id as string
  
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then(res => res.json())
      .then(data => {
        setInvoice(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return <div className="p-xl text-center text-on-surface-variant">Loading invoice...</div>
  if (!invoice || invoice.error) return <div className="p-xl text-center text-error">Invoice not found</div>

  const handleSendEmail = async () => {
    if (!confirm('Are you sure you want to send this invoice?')) return
    try {
      const pdfBase64 = await generateInvoicePDF(invoice, 'datauristring')
      const res = await fetch(`/api/invoices/${id}/send`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64 })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        alert('Email sent successfully!')
        setInvoice({...invoice, status: 'SENT'})
      } else {
        alert('Failed to send email: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error(error)
      alert('Failed to send email. Please check your connection or company SMTP settings.')
    }
  }

  const handleDownloadPDF = async () => {
    await generateInvoicePDF(invoice, 'download')
  }

  // Formatting date
  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <main className="flex-1 p-lg lg:p-xl max-w-container-max mx-auto w-full space-y-xl">
      {/* Top Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md print:hidden">
        <div className="flex items-center gap-md">
          <Link href="/invoices" className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </Link>
          <div>
            <h2 className="font-headline-lg text-headline-lg md:font-headline-lg md:text-headline-lg font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Invoice {invoice.invoice_number}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
              Status: <span className="font-semibold text-primary">{invoice.status}</span>
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-sm w-full sm:w-auto">
          <button 
            onClick={handleDownloadPDF}
            className="px-md py-sm text-primary font-label-md text-label-md border border-primary rounded-lg hover:bg-surface-container transition-colors flex items-center justify-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Download PDF
          </button>
          <button 
            onClick={handleSendEmail} 
            className="px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-colors flex items-center justify-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            Send Email
          </button>
        </div>
      </div>

      {/* Invoice A4 Paper Preview */}
      <div className="bg-white border border-outline-variant p-[40px] max-w-[800px] mx-auto shadow-md text-[#333] font-sans text-[13px] leading-relaxed">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            {invoice.company.logo_url && (
              <img src={invoice.company.logo_url} alt="Company Logo" className="h-[50px] mb-4 object-contain" />
            )}
            <h2 className="text-[20px] font-bold text-[#1a1a1a] mb-1">{invoice.company.name}</h2>
            <div className="text-[#555]">
              {invoice.company.address && <p className="whitespace-pre-wrap">{invoice.company.address}</p>}
              <p className="mt-2"><strong className="text-[#333]">GSTIN:</strong> {invoice.company.gstin}</p>
              {invoice.company.phone && <p><strong className="text-[#333]">Phone:</strong> {invoice.company.phone}</p>}
              {invoice.company.email && <p><strong className="text-[#333]">Email:</strong> {invoice.company.email}</p>}
            </div>
          </div>
          
          <div className="w-[300px]">
            <h1 className="text-[28px] font-bold text-[#0033a0] text-right mb-4 uppercase tracking-wide">TAX INVOICE</h1>
            
            <div className="bg-[#f8f9fa] border border-[#e9ecef] p-4 text-[#333]">
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-[#555] text-[11px] tracking-wider uppercase w-32">INVOICE NO</span>
                <span className="font-bold text-right">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-[#555] text-[11px] tracking-wider uppercase w-32">INVOICE DATE</span>
                <span className="font-bold text-right">{formatDate(invoice.date)}</span>
              </div>
              {invoice.due_date && (
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-[#555] text-[11px] tracking-wider uppercase w-32">DUE DATE</span>
                  <span className="font-bold text-right">{formatDate(invoice.due_date)}</span>
                </div>
              )}
              {invoice.place_of_supply && (
                <div className="flex justify-between">
                  <span className="font-semibold text-[#555] text-[11px] tracking-wider uppercase w-32">PLACE OF SUPPLY</span>
                  <span className="font-bold text-right">{invoice.place_of_supply}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Billed To / Shipped To Section */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-[#f8f9fa] border border-[#e9ecef] p-4">
            <h3 className="font-bold text-[#0033a0] text-[12px] uppercase tracking-wider mb-2">BILLED TO</h3>
            <p className="font-bold text-[14px] text-[#1a1a1a] mb-1">{invoice.customer.name}</p>
            {invoice.customer.address && <p className="text-[#555] whitespace-pre-wrap leading-tight">{invoice.customer.address}</p>}
            {invoice.customer.gstin && <p className="mt-3 text-[#333]"><strong className="text-[#1a1a1a]">GSTIN:</strong> {invoice.customer.gstin}</p>}
            {invoice.customer.phone && <p className="mt-1 text-[#555]">Phone: {invoice.customer.phone}</p>}
            {invoice.customer.email && <p className="text-[#555]">Email: {invoice.customer.email}</p>}
          </div>

          <div className="bg-[#f8f9fa] border border-[#e9ecef] p-4">
            <h3 className="font-bold text-[#0033a0] text-[12px] uppercase tracking-wider mb-2">SHIPPED TO</h3>
            {/* Using Customer Details as Shipped To default */}
            <p className="font-bold text-[14px] text-[#1a1a1a] mb-1">{invoice.customer.name}</p>
            {invoice.customer.address && <p className="text-[#555] whitespace-pre-wrap leading-tight">{invoice.customer.address}</p>}
            {invoice.customer.state && <p className="mt-3 text-[#333]"><strong className="text-[#1a1a1a]">State Code:</strong> {invoice.customer.state}</p>}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8 border border-[#e9ecef]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f0f4f8]">
                <th className="py-3 px-3 text-[11px] font-bold text-[#0033a0] uppercase border-b border-[#e9ecef]">#</th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#0033a0] uppercase border-b border-[#e9ecef]">DESCRIPTION OF GOODS/SERVICES</th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#0033a0] uppercase border-b border-[#e9ecef] text-center">HSN/SAC</th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#0033a0] uppercase border-b border-[#e9ecef] text-right">QTY</th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#0033a0] uppercase border-b border-[#e9ecef] text-right">RATE (₹)</th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#0033a0] uppercase border-b border-[#e9ecef] text-right">GST %</th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#0033a0] uppercase border-b border-[#e9ecef] text-right">AMOUNT (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, idx: number) => (
                <tr key={item.id} className="border-b border-[#e9ecef] last:border-b-0">
                  <td className="py-3 px-3 text-[#555]">{idx + 1}</td>
                  <td className="py-3 px-3 text-[#1a1a1a]">
                    <div className="font-semibold">{item.item_name}</div>
                    {item.description && <div className="text-[11px] text-[#777] mt-1">{item.description}</div>}
                  </td>
                  <td className="py-3 px-3 text-[#555] text-center bg-[#f8f9fa]">{item.hsn_sac || '-'}</td>
                  <td className="py-3 px-3 text-[#333] text-right">{item.quantity}</td>
                  <td className="py-3 px-3 text-[#333] text-right">{item.rate.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  <td className="py-3 px-3 text-[#333] text-right">{item.tax_rate}%</td>
                  <td className="py-3 px-3 text-[#1a1a1a] font-semibold text-right">{item.total_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-8">
          <div className="w-[300px]">
            <div className="flex justify-between py-2 border-b border-[#e9ecef]">
              <span className="text-[#555] font-semibold">Sub Total</span>
              <span className="font-semibold text-[#1a1a1a]">₹ {invoice.sub_total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#e9ecef]">
              <span className="text-[#555] font-semibold">Tax Total</span>
              <span className="font-semibold text-[#1a1a1a]">₹ {invoice.tax_total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between py-3 border-b-2 border-[#1a1a1a] bg-[#f8f9fa] px-2 mt-2">
              <span className="font-bold text-[#0033a0] text-[16px]">Grand Total</span>
              <span className="font-bold text-[#1a1a1a] text-[16px]">₹ {invoice.grand_total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        {(invoice.notes || invoice.terms) && (
          <div className="grid grid-cols-2 gap-8 text-[11px] pt-4 border-t border-[#e9ecef]">
            {invoice.notes && (
              <div>
                <h4 className="font-bold text-[#0033a0] uppercase tracking-wider mb-2">Notes</h4>
                <p className="text-[#555] whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h4 className="font-bold text-[#0033a0] uppercase tracking-wider mb-2">Terms & Conditions</h4>
                <p className="text-[#555] whitespace-pre-wrap leading-relaxed">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
