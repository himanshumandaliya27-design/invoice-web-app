import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateInvoicePdfBuffer } from '@/lib/generate-pdf'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: (await params).id },
      include: {
        items: {
          include: { product: true }
        },
        customer: true,
        company: true
      }
    })
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const pdfBuffer = await generateInvoicePdfBuffer(invoice)

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
