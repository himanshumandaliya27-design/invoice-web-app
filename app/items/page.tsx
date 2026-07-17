import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import ItemsClient from './ItemsClient'

export const dynamic = 'force-dynamic'

export default async function ItemsPage() {
  const cookieStore = await cookies()
  const activeCompanyId = cookieStore.get('activeCompanyId')?.value

  const where = activeCompanyId ? { company_id: activeCompanyId } : {}
  const items = await prisma.item.findMany({
    where,
    orderBy: { created_at: 'desc' }
  })

  const safeItems = items.map(i => ({
    id: i.id,
    name: i.name,
    description: i.description,
    price: i.price,
    hsn_sac: i.hsn_sac,
    tax_rate: i.tax_rate
  }))

  return <ItemsClient initialItems={safeItems} />
}
