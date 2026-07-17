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

  // Format dates / nulls if needed
  const safeInvoices = invoices.map(i => ({
    id: i.id,
    invoice_number: i.invoice_number,
    date: i.date.toISOString(),
    grand_total: i.grand_total,
    status: i.status,
    customer: {
      name: i.customer.name,
      email: i.customer.email || undefined
    }
  }))

  return <InvoicesClient initialInvoices={safeInvoices} />
}
