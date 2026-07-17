import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  const cookieStore = await cookies()
  const companyId = cookieStore.get('activeCompanyId')?.value

  if (!query || !companyId) {
    return NextResponse.json({ invoices: [], customers: [], items: [] })
  }

  try {
    const [invoices, customers, items] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          company_id: companyId,
          invoice_number: {
            contains: query,
          },
        },
        include: {
          customer: true
        },
        take: 10
      }),
      prisma.customer.findMany({
        where: {
          company_id: companyId,
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { gstin: { contains: query } }
          ]
        },
        take: 10
      }),
      prisma.item.findMany({
        where: {
          company_id: companyId,
          OR: [
            { name: { contains: query } },
            { hsn_sac: { contains: query } }
          ]
        },
        take: 10
      })
    ])

    return NextResponse.json({ invoices, customers, items })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
  }
}
