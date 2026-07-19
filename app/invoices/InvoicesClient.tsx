'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { generateInvoicePDF } from '@/lib/generate-pdf-client'

type Invoice = {
  id: string
  invoice_number: string
  date: Date
  due_date: Date | null
  status: string
  customer: {
    name: string
  }
  grand_total: number
}

export default function InvoicesClient({ initialInvoices }: { initialInvoices: Invoice[] }) {
  const [search, setSearch] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewInvoiceNo, setPreviewInvoiceNo] = useState('')
  const router = useRouter()

  const filteredInvoices = initialInvoices.filter(i => 
    i.invoice_number.toLowerCase().includes(search.toLowerCase()) || 
    i.customer.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    try {
      await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      router.refresh()
    } catch (error) {
      console.error(error)
    }
  }

  const handleSendEmail = async (id: string) => {
    if (!confirm('Are you sure you want to send this invoice to the customer?')) return
    try {
      // 1. Fetch full invoice details
      const invoiceRes = await fetch(`/api/invoices/${id}`)
      if (!invoiceRes.ok) throw new Error('Failed to fetch invoice details')
      const invoice = await invoiceRes.json()

      // 2. Generate PDF client side
      const pdfBase64 = await generateInvoicePDF(invoice, 'datauristring')

      // 3. Send to server
      const res = await fetch(`/api/invoices/${id}/send`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64 })
      })
      if (!res.ok) throw new Error('Failed to send email')
      alert('Invoice sent successfully!')
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Error sending email. Check company SMTP settings or invoice details.')
    }
  }

  const handleDownloadPDF = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`)
      if (!res.ok) throw new Error('Failed to fetch invoice details')
      const invoice = await res.json()
      await generateInvoicePDF(invoice, 'download')
    } catch (error) {
      console.error(error)
      alert('Error generating PDF.')
    }
  }

  const handlePreview = async (id: string, invoiceNo: string) => {
    setPreviewLoading(true)
    setPreviewInvoiceNo(invoiceNo)
    setPreviewUrl(null)
    try {
      const res = await fetch(`/api/invoices/${id}`)
      if (!res.ok) throw new Error('Failed to fetch invoice details')
      const invoice = await res.json()
      const dataUri = await generateInvoicePDF(invoice, 'datauristring') as string
      setPreviewUrl(dataUri)
    } catch (error) {
      console.error(error)
      alert('Error generating preview.')
      setPreviewLoading(false)
      return
    }
    setPreviewLoading(false)
  }

  const closePreview = () => {
    setPreviewUrl(null)
    setPreviewInvoiceNo('')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <span className="bg-surface-variant text-on-surface-variant px-2 py-1 rounded-md text-xs font-bold tracking-wide">DRAFT</span>
      case 'SENT': return <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded-md text-xs font-bold tracking-wide">SENT</span>
      case 'PAID': return <span className="bg-primary-container text-on-primary-container px-2 py-1 rounded-md text-xs font-bold tracking-wide">PAID</span>
      case 'OVERDUE': return <span className="bg-error-container text-on-error-container px-2 py-1 rounded-md text-xs font-bold tracking-wide">OVERDUE</span>
      default: return <span className="bg-surface-variant px-2 py-1 rounded-md text-xs font-bold">{status}</span>
    }
  }

  return (
    <main className="flex-1 p-lg lg:p-xl max-w-container-max mx-auto w-full space-y-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg md:font-headline-lg md:text-headline-lg font-headline-lg-mobile text-headline-lg-mobile text-primary font-['Aclonica']">Invoices</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Create and manage your billing.</p>
        </div>
        <Link href="/invoices/new" className="w-full sm:w-auto px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-colors flex items-center justify-center gap-xs shadow-md">
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Create Invoice
        </Link>
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Search by invoice number or customer..." 
              className="w-full pl-xl pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-bright border-b border-outline-variant">
                <th className="font-label-md text-label-md text-on-surface-variant py-md px-lg font-semibold uppercase tracking-wider">Invoice Info</th>
                <th className="font-label-md text-label-md text-on-surface-variant py-md px-lg font-semibold uppercase tracking-wider">Customer</th>
                <th className="font-label-md text-label-md text-on-surface-variant py-md px-lg font-semibold uppercase tracking-wider">Amount</th>
                <th className="font-label-md text-label-md text-on-surface-variant py-md px-lg font-semibold uppercase tracking-wider">Status</th>
                <th className="font-label-md text-label-md text-on-surface-variant py-md px-lg font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-table-data text-table-data text-on-surface divide-y divide-outline-variant">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-xl px-lg text-center text-on-surface-variant">No invoices found.</td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-md px-lg">
                      <div className="font-medium text-primary text-base">{invoice.invoice_number}</div>
                      <div className="text-on-surface-variant text-sm mt-1">{new Date(invoice.date).toLocaleDateString('en-IN')}</div>
                    </td>
                    <td className="py-md px-lg font-medium text-on-surface">{invoice.customer.name}</td>
                    <td className="py-md px-lg font-medium text-on-surface">
                      ₹{invoice.grand_total.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </td>
                    <td className="py-md px-lg">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="py-md px-lg text-right">
                      <div className="flex justify-end space-x-sm">
                        {/* Preview Button */}
                        <button 
                          onClick={() => handlePreview(invoice.id, invoice.invoice_number)}
                          className="text-tertiary p-2 rounded hover:bg-surface-container border border-transparent hover:border-tertiary transition-all"
                          title="Preview Invoice"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                        <button 
                          onClick={() => handleDownloadPDF(invoice.id)}
                          className="text-secondary p-2 rounded hover:bg-surface-container border border-transparent hover:border-secondary transition-all"
                          title="Download PDF"
                        >
                          <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                        </button>
                        <button 
                          className="text-primary p-2 rounded hover:bg-surface-container border border-transparent hover:border-primary transition-all"
                          onClick={() => handleSendEmail(invoice.id)}
                          title="Send Email"
                        >
                          <span className="material-symbols-outlined text-[20px]">mail</span>
                        </button>
                        <button 
                          className="text-error p-2 rounded hover:bg-error-container border border-transparent hover:border-error transition-all"
                          onClick={() => handleDelete(invoice.id)}
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {(previewLoading || previewUrl) && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={closePreview}
        >
          <div 
            className="bg-surface rounded-2xl shadow-2xl flex flex-col w-[95vw] max-w-4xl h-[92vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant bg-surface-bright">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[24px]">description</span>
                <div>
                  <h3 className="font-title-md text-title-md font-semibold text-on-surface">Invoice Preview</h3>
                  {previewInvoiceNo && (
                    <p className="text-xs text-on-surface-variant">{previewInvoiceNo}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-sm">
                {previewUrl && (
                  <a
                    href={previewUrl}
                    download={`Invoice-${previewInvoiceNo}.pdf`}
                    className="flex items-center gap-xs px-md py-sm bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Download
                  </a>
                )}
                <button 
                  onClick={closePreview}
                  className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden bg-surface-container-low">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-md">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-on-surface-variant font-body-md text-body-md">Generating preview...</p>
                </div>
              ) : previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title={`Invoice ${previewInvoiceNo} Preview`}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
