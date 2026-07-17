import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveCompanyId } from '@/app/actions/company'

export async function GET() {
  try {
    const companyId = await getActiveCompanyId()
    if (!companyId) return NextResponse.json([])

    const invoices = await prisma.invoice.findMany({
      where: { company_id: companyId },
      include: { customer: true },
      orderBy: { created_at: 'desc' }
    })
    return NextResponse.json(invoices)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const companyId = await getActiveCompanyId()
    if (!companyId) return NextResponse.json({ error: 'No active company' }, { status: 400 })

    // Create the invoice along with its items
    const invoice = await prisma.invoice.create({
      data: {
        company_id: companyId,
        invoice_number: data.invoice_number,
        date: new Date(data.date),
        due_date: data.due_date ? new Date(data.due_date) : null,
        status: data.status || 'DRAFT',
        customer_id: data.customer_id,
        sub_total: data.sub_total,
        tax_total: data.tax_total,
        grand_total: data.grand_total,
        notes: data.notes || null,
        terms: data.terms || null,
        items: {
          create: data.items.map((item: any) => ({
            item_name: item.item_name,
            description: item.description || null,
            hsn_sac: item.hsn_sac || null,
            quantity: item.quantity,
            rate: item.rate,
            tax_rate: item.tax_rate,
            total_amount: item.total_amount
          }))
        }
      },
      include: {
        items: true,
        customer: true,
        company: true
      }
    })
    
    return NextResponse.json(invoice)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
