'use client'

import { useState, useEffect } from 'react'

type Customer = {
  id: string
  name: string
  email: string | null
  phone: string | null
  gstin: string | null
  address: string | null
  state: string | null
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', gstin: '', address: '', state: '' })
  const [editCustomerId, setEditCustomerId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers')
      const data = await res.json()
      setCustomers(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.gstin && c.gstin.toLowerCase().includes(search.toLowerCase()))
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    try {
      await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      fetchCustomers()
    } catch (error) {
      console.error(error)
    }
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editCustomerId ? `/api/customers/${editCustomerId}` : '/api/customers'
      const method = editCustomerId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      })
      if (res.ok) {
        setIsModalOpen(false)
        setNewCustomer({ name: '', email: '', phone: '', gstin: '', address: '', state: '' })
        setEditCustomerId(null)
        fetchCustomers()
      } else {
        alert(`Failed to ${editCustomerId ? 'update' : 'add'} customer`)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditClick = (customer: Customer) => {
    setEditCustomerId(customer.id)
    setNewCustomer({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      gstin: customer.gstin || '',
      address: customer.address || '',
      state: customer.state || ''
    })
    setIsModalOpen(true)
  }

  const handleAddNewClick = () => {
    setEditCustomerId(null)
    setNewCustomer({ name: '', email: '', phone: '', gstin: '', address: '', state: '' })
    setIsModalOpen(true)
  }

  return (
    <main className="flex-1 p-lg lg:p-xl max-w-container-max mx-auto w-full space-y-xl relative">
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface rounded-xl p-lg w-full max-w-[448px] shadow-lg">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">
              {editCustomerId ? 'Edit Customer' : 'Add New Customer'}
            </h3>
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
              <div className="flex justify-end gap-sm mt-lg pt-sm">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-md py-sm text-primary font-label-md text-label-md hover:bg-surface-container rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container disabled:opacity-50">
                  {submitting ? 'Saving...' : (editCustomerId ? 'Update Customer' : 'Save Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg md:font-headline-lg md:text-headline-lg font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Customers</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Manage your client database and GSTINs.</p>
        </div>
        <button onClick={handleAddNewClick} className="w-full sm:w-auto px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-colors flex items-center justify-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Customer
        </button>
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col">
        <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Search customers..." 
              className="w-full pl-xl pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-xl text-on-surface-variant">Loading customers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-bright border-b border-outline-variant">
                  <th className="font-label-md text-label-md text-on-surface-variant uppercase py-md px-lg font-semibold">Name</th>
                  <th className="font-label-md text-label-md text-on-surface-variant uppercase py-md px-lg font-semibold">Contact Details</th>
                  <th className="font-label-md text-label-md text-on-surface-variant uppercase py-md px-lg font-semibold">GSTIN</th>
                  <th className="font-label-md text-label-md text-on-surface-variant uppercase py-md px-lg font-semibold">State</th>
                  <th className="font-label-md text-label-md text-on-surface-variant uppercase py-md px-lg font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-table-data text-table-data text-on-surface divide-y divide-outline-variant">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-xl px-lg text-center text-on-surface-variant">No customers found.</td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="py-md px-lg font-medium text-primary">{customer.name}</td>
                      <td className="py-md px-lg">
                        <div className="text-on-surface">{customer.email || '-'}</div>
                        <div className="text-on-surface-variant text-[12px]">{customer.phone || '-'}</div>
                      </td>
                      <td className="py-md px-lg font-table-data">{customer.gstin || '-'}</td>
                      <td className="py-md px-lg text-on-surface-variant">{customer.state || '-'}</td>
                      <td className="py-md px-lg text-right">
                        <div className="flex justify-end space-x-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="text-primary p-xs rounded hover:bg-surface-container"
                            onClick={() => handleEditClick(customer)}
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button 
                            className="text-error p-xs rounded hover:bg-error-container"
                            onClick={() => handleDelete(customer.id)}
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
        )}
      </div>
    </main>
  )
}
