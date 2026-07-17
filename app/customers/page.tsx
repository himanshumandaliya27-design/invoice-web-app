import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import CustomersClient from './CustomersClient'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const cookieStore = await cookies()
  const activeCompanyId = cookieStore.get('activeCompanyId')?.value

  const where = activeCompanyId ? { company_id: activeCompanyId } : {}
  const customers = await prisma.customer.findMany({
    where,
    orderBy: { created_at: 'desc' }
  })

  // Format dates / nulls if needed, though they match the expected type
  const safeCustomers = customers.map(c => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    gstin: c.gstin,
    address: c.address,
    state: c.state
  }))

  return <CustomersClient initialCustomers={safeCustomers} />
}
