'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Invoice = {
  id: string
  invoice_number: string
  date: string
  grand_total: number
  status: string
  customer: {
    name: string
  }
}

type Customer = {
  id: string
  name: string
  email: string | null
  phone: string | null
  gstin: string | null
}

type Product = {
  id: string
  name: string
  description: string | null
  hsn_sac_code: string | null
  price: number
}

function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''

  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<{
    invoices: Invoice[]
    customers: Customer[]
    products: Product[]
  }>({ invoices: [], customers: [], products: [] })

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [query])

  if (!query) {
    return (
      <main className="flex-1 p-lg lg:p-xl max-w-container-max mx-auto w-full">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Please enter a search term.</h2>
      </main>
    )
  }

  return (
    <main className="flex-1 p-lg lg:p-xl max-w-container-max mx-auto w-full space-y-xl">
      <div>
        <h2 className="font-headline-lg text-headline-lg md:font-headline-lg md:text-headline-lg font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Search Results for "{query}"</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Found across Invoices, Customers, and Products.</p>
      </div>

      {loading ? (
        <div className="text-center py-xl text-on-surface-variant">Searching...</div>
      ) : (
        <div className="space-y-xl">
          {/* Invoices */}
          <section>
            <h3 className="font-headline-sm text-headline-sm text-primary mb-md border-b border-outline-variant pb-xs">Invoices ({results.invoices.length})</h3>
            {results.invoices.length === 0 ? (
              <p className="text-on-surface-variant font-body-sm text-body-sm">No matching invoices found.</p>
            ) : (
              <ul className="space-y-sm">
                {results.invoices.map((inv) => (
                  <li key={inv.id} className="bg-surface-container-low p-md rounded-lg border border-outline-variant hover:bg-surface-container transition-colors">
                    <Link href={`/invoices/${inv.id}`} className="block">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-on-surface">{inv.invoice_number}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">₹{inv.grand_total.toFixed(2)}</span>
                      </div>
                      <div className="text-[12px] text-on-surface-variant mt-xs">Customer: {inv.customer?.name} | Status: {inv.status}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Customers */}
          <section>
            <h3 className="font-headline-sm text-headline-sm text-primary mb-md border-b border-outline-variant pb-xs">Customers ({results.customers.length})</h3>
            {results.customers.length === 0 ? (
              <p className="text-on-surface-variant font-body-sm text-body-sm">No matching customers found.</p>
            ) : (
              <ul className="space-y-sm">
                {results.customers.map((cust) => (
                  <li key={cust.id} className="bg-surface-container-low p-md rounded-lg border border-outline-variant hover:bg-surface-container transition-colors">
                    <Link href="/customers" className="block">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-on-surface">{cust.name}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">{cust.gstin || 'No GSTIN'}</span>
                      </div>
                      <div className="text-[12px] text-on-surface-variant mt-xs">{cust.email || 'No email'} | {cust.phone || 'No phone'}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Products */}
          <section>
            <h3 className="font-headline-sm text-headline-sm text-primary mb-md border-b border-outline-variant pb-xs">Products & Services ({results.products.length})</h3>
            {results.products.length === 0 ? (
              <p className="text-on-surface-variant font-body-sm text-body-sm">No matching products found.</p>
            ) : (
              <ul className="space-y-sm">
                {results.products.map((prod) => (
                  <li key={prod.id} className="bg-surface-container-low p-md rounded-lg border border-outline-variant hover:bg-surface-container transition-colors">
                    <Link href="/products" className="block">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-on-surface">{prod.name}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">₹{prod.price.toFixed(2)}</span>
                      </div>
                      <div className="text-[12px] text-on-surface-variant mt-xs">HSN/SAC: {prod.hsn_sac_code || 'N/A'}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-lg lg:p-xl text-center">Loading search results...</div>}>
      <SearchResults />
    </Suspense>
  )
}
