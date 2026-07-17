'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Product = {
  id: string
  name: string
  description: string | null
  hsn_sac_code: string | null
  price: number
  tax_rate: number
}

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', description: '', hsn_sac_code: '', price: 0, tax_rate: 0 })
  const [editProductId, setEditProductId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const router = useRouter()

  const filteredProducts = initialProducts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.hsn_sac_code && p.hsn_sac_code.toLowerCase().includes(search.toLowerCase()))
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      router.refresh()
    } catch (error) {
      console.error(error)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editProductId ? `/api/products/${editProductId}` : '/api/products'
      const method = editProductId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      })
      if (res.ok) {
        setIsModalOpen(false)
        setNewProduct({ name: '', description: '', hsn_sac_code: '', price: 0, tax_rate: 0 })
        setEditProductId(null)
        router.refresh()
      } else {
        alert(`Failed to ${editProductId ? 'update' : 'add'} product`)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditClick = (product: Product) => {
    setEditProductId(product.id)
    setNewProduct({
      name: product.name,
      description: product.description || '',
      hsn_sac_code: product.hsn_sac_code || '',
      price: product.price,
      tax_rate: product.tax_rate
    })
    setIsModalOpen(true)
  }

  const handleAddNewClick = () => {
    setEditProductId(null)
    setNewProduct({ name: '', description: '', hsn_sac_code: '', price: 0, tax_rate: 0 })
    setIsModalOpen(true)
  }

  return (
    <main className="flex-1 p-lg lg:p-xl max-w-container-max mx-auto w-full space-y-xl relative">
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface rounded-xl p-lg w-full max-w-[448px] shadow-lg">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">
              {editProductId ? 'Edit Product / Service' : 'Add New Product / Service'}
            </h3>
            <form onSubmit={handleAddProduct} className="space-y-sm">
              <div>
                <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Name *</label>
                <input required type="text" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div>
                <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Description</label>
                <input type="text" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
              </div>
              <div>
                <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">HSN/SAC Code</label>
                <input type="text" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newProduct.hsn_sac_code} onChange={e => setNewProduct({...newProduct, hsn_sac_code: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Price (₹)</label>
                  <input type="number" step="0.01" min="0" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm block text-on-surface-variant mb-xs">Tax Rate (%)</label>
                  <input type="number" step="0.01" min="0" max="100" className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={newProduct.tax_rate} onChange={e => setNewProduct({...newProduct, tax_rate: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div className="flex justify-end gap-sm mt-lg pt-sm">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-md py-sm text-primary font-label-md text-label-md hover:bg-surface-container rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container disabled:opacity-50">
                  {submitting ? 'Saving...' : (editProductId ? 'Update Product' : 'Save Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg md:font-headline-lg md:text-headline-lg font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Products & Services</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Manage your inventory and tax rates.</p>
        </div>
        <button onClick={handleAddNewClick} className="w-full sm:w-auto px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-colors flex items-center justify-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Product
        </button>
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col">
        <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-xl pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-bright border-b border-outline-variant">
                <th className="font-label-md text-label-md text-on-surface-variant uppercase py-md px-lg font-semibold w-1/3">Name & Description</th>
                <th className="font-label-md text-label-md text-on-surface-variant uppercase py-md px-lg font-semibold w-1/6">HSN/SAC</th>
                <th className="font-label-md text-label-md text-on-surface-variant uppercase py-md px-lg font-semibold w-1/6 text-right">Price</th>
                <th className="font-label-md text-label-md text-on-surface-variant uppercase py-md px-lg font-semibold w-1/6 text-right">Tax Rate</th>
                <th className="font-label-md text-label-md text-on-surface-variant uppercase py-md px-lg font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-table-data text-table-data text-on-surface divide-y divide-outline-variant">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-xl px-lg text-center text-on-surface-variant">No products found.</td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="py-md px-lg">
                      <div className="font-medium text-primary">{product.name}</div>
                      {product.description && <div className="text-on-surface-variant text-[12px] truncate max-w-sm">{product.description}</div>}
                    </td>
                    <td className="py-md px-lg font-table-data text-on-surface-variant">{product.hsn_sac_code || '-'}</td>
                    <td className="py-md px-lg font-table-data text-right font-medium">₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-md px-lg font-table-data text-right">{product.tax_rate}%</td>
                    <td className="py-md px-lg text-right">
                      <div className="flex justify-end space-x-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          className="text-primary p-xs rounded hover:bg-surface-container"
                          onClick={() => handleEditClick(product)}
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button 
                          className="text-error p-xs rounded hover:bg-error-container"
                          onClick={() => handleDelete(product.id)}
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
