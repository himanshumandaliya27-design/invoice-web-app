import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { pdfBase64 } = await req.json()

    if (!pdfBase64) {
      return NextResponse.json({ error: 'PDF Base64 data is required' }, { status: 400 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
        company: true
      }
    })

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    if (!invoice.company.smtp_host || !invoice.company.smtp_user || !invoice.company.smtp_pass) {
      return NextResponse.json({ error: 'SMTP credentials not configured in company settings' }, { status: 400 })
    }
    if (!invoice.customer.email) {
      return NextResponse.json({ error: 'Customer does not have an email address' }, { status: 400 })
    }

    const company = invoice.company
    const customer = invoice.customer

    // pdfBase64 is a data URI like "data:application/pdf;filename=generated.pdf;base64,JVBER..."
    // We need to extract the base64 part
    const base64Data = pdfBase64.split('base64,')[1]
    const pdfBuffer = Buffer.from(base64Data, 'base64')

    // Setup Nodemailer
    const transporter = nodemailer.createTransport({
      host: company.smtp_host,
      port: company.smtp_port || 587,
      secure: company.smtp_port === 465,
      auth: {
        user: company.smtp_user,
        pass: company.smtp_pass
      }
    } as any)

    await transporter.sendMail({
      from: `"${company.name}" <${company.smtp_user}>`,
      to: customer.email as string,
      subject: `Invoice ${invoice.invoice_number} from ${company.name}`,
      text: `Dear ${customer.name},\n\nPlease find attached the invoice ${invoice.invoice_number} for Rs ${invoice.grand_total.toFixed(2)}.\n\nThank you for your business!\n\nRegards,\n${company.name}`,
      attachments: [
        {
          filename: `Invoice-${invoice.invoice_number}.pdf`,
          content: pdfBuffer
        }
      ]
    })

    if (invoice.status === 'DRAFT') {
      await prisma.invoice.update({
        where: { id },
        data: { status: 'SENT' }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
