'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye, FileText, Send, Mail } from 'lucide-react'

type Invoice = {
  id: string
  invoice_number: string
  date: string
  grand_total: number
  status: string
  customer: {
    name: string
    email?: string
  }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices')
      const data = await res.json()
      setInvoices(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const filteredInvoices = invoices.filter(i => 
    i.invoice_number.toLowerCase().includes(search.toLowerCase()) || 
    i.customer.name.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">DRAFT</span>
      case 'SENT': return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">SENT</span>
      case 'PAID': return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">PAID</span>
      case 'CANCELLED': return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">CANCELLED</span>
      default: return null
    }
  }

  const handleSendEmail = async (invoice: Invoice) => {
    if (!invoice.customer.email) {
      alert('This customer does not have an email address saved.');
      return;
    }

    const subject = encodeURIComponent(`Invoice ${invoice.invoice_number}`);
    const host = window.location.origin;
    const body = encodeURIComponent(`Dear ${invoice.customer.name},\n\nPlease find your invoice ${invoice.invoice_number} at the following link:\n\n${host}/api/invoices/${invoice.id}/pdf\n\nAmount Due: ₹${invoice.grand_total.toFixed(2)}\n\nThank you for your business.`);
    
    // Open default mail client
    window.location.href = `mailto:${invoice.customer.email}?subject=${subject}&body=${body}`;

    // Mark as sent in the database
    try {
      await fetch(`/api/invoices/${invoice.id}/mark-sent`, { method: 'POST' })
      fetchInvoices()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#121c2a]">Invoices</h1>
        <Link href="/invoices/new" className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </Link>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search invoices..." 
              className="input-field pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading invoices...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#c4c5d5]">
                  <th className="py-3 px-4 text-xs font-semibold text-[#444653] uppercase">Invoice #</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#444653] uppercase">Date</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#444653] uppercase">Customer</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#444653] uppercase text-right">Amount</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#444653] uppercase text-center">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#444653] uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">No invoices found.</td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-[#eff3ff] hover:bg-[#f9f9ff] transition-colors">
                      <td className="py-3 px-4 font-medium text-[#1e40af]">{invoice.invoice_number}</td>
                      <td className="py-3 px-4 table-data">{new Date(invoice.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-[#121c2a]">{invoice.customer.name}</td>
                      <td className="py-3 px-4 text-right table-data font-semibold">₹{invoice.grand_total.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(invoice.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Link href={`/invoices/${invoice.id}`} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="View">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer" className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Download PDF">
                            <FileText className="w-4 h-4" />
                          </a>
                          <button onClick={() => handleSendEmail(invoice)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Send Email">
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
