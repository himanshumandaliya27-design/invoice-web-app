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

  const safeCustomers = customers.map(c => ({
    id: c.id,
    name: c.name,
    address: c.address,
    mobile: c.mobile,
    email: c.email,
    gstin: c.gstin,
    state: c.state
  }))

  return <CustomersClient initialCustomers={safeCustomers} />
}
