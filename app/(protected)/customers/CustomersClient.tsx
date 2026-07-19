'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Customer = {
  id: string
  name: string
  address: string | null
  mobile: string | null
  email: string | null
  gstin: string | null
  state: string | null
}

export default function CustomersClient({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', address: '', mobile: '', email: '', gstin: '', state: '' })
  const [editCustomerId, setEditCustomerId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const router = useRouter()

  const filteredCustomers = initialCustomers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.gstin && c.gstin.toLowerCase().includes(search.toLowerCase()))
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    try {
      await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      router.refresh()
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
        setNewCustomer({ name: '', address: '', mobile: '', email: '', gstin: '', state: '' })
        setEditCustomerId(null)
        router.refresh()
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
      address: customer.address || '',
      mobile: customer.mobile || '',
      email: customer.email || '',
      gstin: customer.gstin || '',
      state: customer.state || ''
    })
    setIsModalOpen(true)
  }

  const handleAddNewClick = () => {
    setEditCustomerId(null)
    setNewCustomer({ name: '', address: '', mobile: '', email: '', gstin: '', state: '' })
    setIsModalOpen(true)
  }

  return (
    <main className="flex-1 p-lg lg:p-xl max-w-container-max mx-auto w-full space-y-xl relative">
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md backdrop-blur-sm">
          <div className="bg-surface rounded-xl p-lg w-full max-w-[500px] shadow-2xl border border-outline-variant">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-md font-['Aclonica']">
              {editCustomerId ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <form onSubmit={handleAddCustomer} className="space-y-sm">
              <div>
                <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Name *</label>
                <input required type="text" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="Customer/Business Name" />
              </div>
              <div>
                <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Address</label>
                <textarea className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[60px]" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} placeholder="Full address" />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Mobile</label>
                  <input type="text" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newCustomer.mobile} onChange={e => setNewCustomer({...newCustomer, mobile: e.target.value})} placeholder="+91..." />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Email</label>
                  <input type="email" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} placeholder="client@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">GSTIN</label>
                  <input type="text" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none uppercase" value={newCustomer.gstin} onChange={e => setNewCustomer({...newCustomer, gstin: e.target.value})} placeholder="22AAAAA0000A1Z5" />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">State (Code/Name)</label>
                  <input type="text" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newCustomer.state} onChange={e => setNewCustomer({...newCustomer, state: e.target.value})} placeholder="e.g. 24 or Gujarat" />
                </div>
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
          <h2 className="font-headline-lg text-headline-lg md:font-headline-lg md:text-headline-lg font-headline-lg-mobile text-headline-lg-mobile text-primary font-['Aclonica']">Customers</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Manage your client list and billing details.</p>
        </div>
        <button onClick={handleAddNewClick} className="w-full sm:w-auto px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-colors flex items-center justify-center gap-xs shadow-md">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Add Customer
        </button>
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Search customers by name or GSTIN..." 
              className="w-full pl-xl pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface-bright border-b border-outline-variant">
                <th className="font-label-md text-label-md text-on-surface-variant py-md px-lg font-semibold uppercase tracking-wider">Name & Contact</th>
                <th className="font-label-md text-label-md text-on-surface-variant py-md px-lg font-semibold uppercase tracking-wider">GSTIN & State</th>
                <th className="font-label-md text-label-md text-on-surface-variant py-md px-lg font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-table-data text-table-data text-on-surface divide-y divide-outline-variant">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-xl px-lg text-center text-on-surface-variant">No customers found.</td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-md px-lg">
                      <div className="font-medium text-primary text-base">{customer.name}</div>
                      <div className="text-on-surface-variant text-sm mt-1 flex items-center gap-2">
                        {customer.mobile && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">call</span> {customer.mobile}</span>}
                        {customer.email && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">mail</span> {customer.email}</span>}
                      </div>
                    </td>
                    <td className="py-md px-lg">
                      <div className="font-medium text-on-surface uppercase">{customer.gstin || '-'}</div>
                      <div className="text-on-surface-variant text-sm">{customer.state || '-'}</div>
                    </td>
                    <td className="py-md px-lg text-right">
                      <div className="flex justify-end space-x-sm">
                        <button 
                          className="text-primary p-2 rounded hover:bg-surface-container border border-transparent hover:border-primary transition-all"
                          onClick={() => handleEditClick(customer)}
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button 
                          className="text-error p-2 rounded hover:bg-error-container border border-transparent hover:border-error transition-all"
                          onClick={() => handleDelete(customer.id)}
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
    </main>
  )
}
