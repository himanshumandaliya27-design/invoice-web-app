import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ invoices: [], customers: [], products: [] })
  }

  try {
    const [invoices, customers, products] = await Promise.all([
      prisma.invoice.findMany({
        where: {
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
          is_deleted: false,
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { gstin: { contains: query } }
          ]
        },
        take: 10
      }),
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { hsn_sac_code: { contains: query } }
          ]
        },
        take: 10
      })
    ])

    return NextResponse.json({ invoices, customers, products })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
  }
}
