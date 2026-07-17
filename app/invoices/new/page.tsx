import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import NewInvoiceClient from './NewInvoiceClient'

export const dynamic = 'force-dynamic'

export default async function NewInvoicePage() {
  const cookieStore = await cookies()
  const activeCompanyId = cookieStore.get('activeCompanyId')?.value

  const where = activeCompanyId ? { company_id: activeCompanyId } : {}
  
  // Fetch customers and items for the active company
  const [customers, items, company] = await Promise.all([
    prisma.customer.findMany({ where, orderBy: { name: 'asc' } }),
    prisma.item.findMany({ where, orderBy: { name: 'asc' } }),
    activeCompanyId ? prisma.company.findUnique({ where: { id: activeCompanyId } }) : null
  ])

  // Get next invoice number
  const lastInvoice = await prisma.invoice.findFirst({
    where,
    orderBy: { created_at: 'desc' }
  })
  
  let nextNumber = 'INV-001'
  if (lastInvoice) {
    const match = lastInvoice.invoice_number.match(/(\d+)$/)
    if (match) {
      const num = parseInt(match[1]) + 1
      nextNumber = `INV-${num.toString().padStart(3, '0')}`
    } else {
      nextNumber = `${lastInvoice.invoice_number}-copy`
    }
  }

  const safeCustomers = customers.map(c => ({ id: c.id, name: c.name, address: c.address, gstin: c.gstin }))
  const safeItems = items.map(i => ({ id: i.id, name: i.name, hsn_sac: i.hsn_sac, price: i.price, tax_rate: i.tax_rate }))

  return <NewInvoiceClient 
    customers={safeCustomers} 
    items={safeItems} 
    nextInvoiceNumber={nextNumber}
    company={company ? {
      name: company.name,
      address: company.address,
      gstin: company.gstin
    } : null}
  />
}
