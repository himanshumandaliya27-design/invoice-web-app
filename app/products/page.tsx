import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import ProductsClient from './ProductsClient'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const cookieStore = await cookies()
  const activeCompanyId = cookieStore.get('activeCompanyId')?.value

  const where = activeCompanyId ? { company_id: activeCompanyId } : {}
  const products = await prisma.product.findMany({
    where,
    orderBy: { created_at: 'desc' }
  })

  // Format dates / nulls if needed, though they match the expected type
  const safeProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    hsn_sac_code: p.hsn_sac_code,
    price: p.price,
    tax_rate: p.tax_rate
  }))

  return <ProductsClient initialProducts={safeProducts} />
}
