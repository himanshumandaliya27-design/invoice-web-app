import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import InvoicesClient from './InvoicesClient'

export const dynamic = 'force-dynamic'

export default async function InvoicesPage() {
  const cookieStore = await cookies()
  const activeCompanyId = cookieStore.get('activeCompanyId')?.value

  const where = activeCompanyId ? { company_id: activeCompanyId } : {}
  const invoices = await prisma.invoice.findMany({
    where,
    include: { customer: true },
    orderBy: { created_at: 'desc' }
  })

  // Calculate Overdue dynamically
  const now = new Date()
  
  const safeInvoices = invoices.map(i => {
    let currentStatus = i.status
    if (currentStatus !== 'PAID' && currentStatus !== 'CANCELLED' && i.due_date && new Date(i.due_date) < now) {
      currentStatus = 'OVERDUE'
    }

    return {
      id: i.id,
      invoice_number: i.invoice_number,
      date: i.date,
      due_date: i.due_date,
      status: currentStatus,
      grand_total: i.grand_total,
      customer: {
        name: i.customer.name
      }
    }
  })

  return <InvoicesClient initialInvoices={safeInvoices} />
}
