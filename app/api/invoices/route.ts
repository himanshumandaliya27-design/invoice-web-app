import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateInvoiceNumber, calculateTaxes } from '@/lib/invoice-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const whereClause = status ? { status } : {}
    
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        customer: true,
      },
      orderBy: { created_at: 'desc' }
    })
    return NextResponse.json(invoices)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { company_id, customer_id, date, due_date, notes, terms_conditions, items } = body

    // 1. Get company and customer to calculate taxes
    const company = await prisma.company.findUnique({ where: { id: company_id } })
    const customer = await prisma.customer.findUnique({ where: { id: customer_id } })

    if (!company || !customer) {
      return NextResponse.json({ error: 'Company or Customer not found' }, { status: 400 })
    }

    // 1.5 Validate HSN/SAC on products
    const productIds = items.map((i: any) => i.product_id)
    const productsInDb = await prisma.product.findMany({ where: { id: { in: productIds } } })
    const missingHsn = productsInDb.find(p => !p.hsn_sac_code || p.hsn_sac_code.trim() === '')
    if (missingHsn) {
      return NextResponse.json({ error: `Product "${missingHsn.name}" is missing an HSN/SAC code. This is required for GST compliance.` }, { status: 400 })
    }

    // Extract state codes from GSTIN if state is not provided directly
    // Assuming first 2 characters of GSTIN represent the state code
    const companyStateCode = company.gstin ? company.gstin.substring(0, 2) : '27'
    const customerStateCode = customer.state || (customer.gstin ? customer.gstin.substring(0, 2) : '27')

    // 2. Auto-calculate taxes
    const { calculatedItems, sub_total, tax_total, grand_total } = calculateTaxes(items, companyStateCode, customerStateCode)

    // 3. Auto-generate invoice number
    const invoice_number = await generateInvoiceNumber(company_id)

    // 4. Create Invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoice_number,
        company_id,
        customer_id,
        date: new Date(date),
        due_date: due_date ? new Date(due_date) : null,
        notes,
        terms_conditions,
        sub_total,
        tax_total,
        grand_total,
        items: {
          create: calculatedItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            rate: item.rate,
            tax_rate: item.tax_rate,
            tax_amount: item.tax_amount,
            cgst_amount: item.cgst_amount,
            sgst_amount: item.sgst_amount,
            igst_amount: item.igst_amount,
            sub_total: item.sub_total,
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

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
