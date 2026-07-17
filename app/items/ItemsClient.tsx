'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Item = {
  id: string
  name: string
  description: string | null
  price: number
  hsn_sac: string | null
  tax_rate: number
}

export default function ItemsClient({ initialItems }: { initialItems: Item[] }) {
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', description: '', price: 0, hsn_sac: '', tax_rate: 18 })
  const [editItemId, setEditItemId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const router = useRouter()

  const filteredItems = initialItems.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    (i.hsn_sac && i.hsn_sac.toLowerCase().includes(search.toLowerCase()))
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await fetch(`/api/items/${id}`, { method: 'DELETE' })
      router.refresh()
    } catch (error) {
      console.error(error)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editItemId ? `/api/items/${editItemId}` : '/api/items'
      const method = editItemId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      })
      if (res.ok) {
        setIsModalOpen(false)
        setNewItem({ name: '', description: '', price: 0, hsn_sac: '', tax_rate: 18 })
        setEditItemId(null)
        router.refresh()
      } else {
        alert(`Failed to ${editItemId ? 'update' : 'add'} item`)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditClick = (item: Item) => {
    setEditItemId(item.id)
    setNewItem({
      name: item.name,
      description: item.description || '',
      price: item.price,
      hsn_sac: item.hsn_sac || '',
      tax_rate: item.tax_rate
    })
    setIsModalOpen(true)
  }

  const handleAddNewClick = () => {
    setEditItemId(null)
    setNewItem({ name: '', description: '', price: 0, hsn_sac: '', tax_rate: 18 })
    setIsModalOpen(true)
  }

  return (
    <main className="flex-1 p-lg lg:p-xl max-w-container-max mx-auto w-full space-y-xl relative">
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md backdrop-blur-sm">
          <div className="bg-surface rounded-xl p-lg w-full max-w-[500px] shadow-2xl border border-outline-variant">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-md font-['Aclonica']">
              {editItemId ? 'Edit Item' : 'Add New Item'}
            </h3>
            <form onSubmit={handleAddItem} className="space-y-sm">
              <div>
                <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Item Name *</label>
                <input required type="text" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Product/Service Name" />
              </div>
              <div>
                <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Description</label>
                <textarea className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[60px]" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="Optional details..." />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Price (₹)</label>
                  <input type="number" step="0.01" required className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">GST Tax Rate (%)</label>
                  <input type="number" step="0.01" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newItem.tax_rate} onChange={e => setNewItem({...newItem, tax_rate: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div>
                <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">HSN/SAC Code</label>
                <input type="text" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newItem.hsn_sac} onChange={e => setNewItem({...newItem, hsn_sac: e.target.value})} placeholder="Optional" />
              </div>
              
              <div className="flex justify-end gap-sm mt-lg pt-sm">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-md py-sm text-primary font-label-md text-label-md hover:bg-surface-container rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container disabled:opacity-50">
                  {submitting ? 'Saving...' : (editItemId ? 'Update Item' : 'Save Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg md:font-headline-lg md:text-headline-lg font-headline-lg-mobile text-headline-lg-mobile text-primary font-['Aclonica']">Items & Inventory</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Manage your products and services list.</p>
        </div>
        <button onClick={handleAddNewClick} className="w-full sm:w-auto px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-colors flex items-center justify-center gap-xs shadow-md">
          <span className="material-symbols-outlined text-[18px]">add_box</span>
          Add Item
        </button>
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Search items by name or HSN/SAC..." 
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
                <th className="font-label-md text-label-md text-on-surface-variant py-md px-lg font-semibold uppercase tracking-wider">Item Details</th>
                <th className="font-label-md text-label-md text-on-surface-variant py-md px-lg font-semibold uppercase tracking-wider">Price (₹)</th>
                <th className="font-label-md text-label-md text-on-surface-variant py-md px-lg font-semibold uppercase tracking-wider">GST %</th>
                <th className="font-label-md text-label-md text-on-surface-variant py-md px-lg font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-table-data text-table-data text-on-surface divide-y divide-outline-variant">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-xl px-lg text-center text-on-surface-variant">No items found.</td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-md px-lg">
                      <div className="font-medium text-primary text-base">{item.name}</div>
                      {item.description && <div className="text-on-surface-variant text-sm mt-1">{item.description}</div>}
                      {item.hsn_sac && <div className="text-on-surface-variant text-xs mt-1 uppercase opacity-70">HSN/SAC: {item.hsn_sac}</div>}
                    </td>
                    <td className="py-md px-lg font-medium text-on-surface">
                      ₹{item.price.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </td>
                    <td className="py-md px-lg">
                      <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded-md text-xs font-bold">{item.tax_rate}%</span>
                    </td>
                    <td className="py-md px-lg text-right">
                      <div className="flex justify-end space-x-sm">
                        <button 
                          className="text-primary p-2 rounded hover:bg-surface-container border border-transparent hover:border-primary transition-all"
                          onClick={() => handleEditClick(item)}
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button 
                          className="text-error p-2 rounded hover:bg-error-container border border-transparent hover:border-error transition-all"
                          onClick={() => handleDelete(item.id)}
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
