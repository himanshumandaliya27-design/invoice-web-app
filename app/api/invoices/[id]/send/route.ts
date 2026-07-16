import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: (await params).id },
      include: {
        customer: true,
        company: true
      }
    })
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!invoice.customer.email) return NextResponse.json({ error: 'Customer has no email' }, { status: 400 })

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Fetch PDF from our own endpoint (simulated here by generating the URL)
    const host = request.headers.get('host')
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    const pdfUrl = `${protocol}://${host}/api/invoices/${invoice.id}/pdf`
    
    // In a real app we'd fetch the PDF directly or generate it in memory, 
    // but doing a fetch is simplest for the email attachment.
    const pdfResponse = await fetch(pdfUrl)
    const pdfBuffer = await pdfResponse.arrayBuffer()

    const info = await transporter.sendMail({
      from: `"${invoice.company.name}" <billing@${host}>`,
      to: invoice.customer.email,
      subject: `Invoice ${invoice.invoice_number} from ${invoice.company.name}`,
      text: `Dear ${invoice.customer.name},\n\nPlease find attached your invoice ${invoice.invoice_number}.\n\nAmount Due: ${invoice.company.currency} ${invoice.grand_total.toFixed(2)}\n\nThank you for your business.`,
      attachments: [
        {
          filename: `${invoice.invoice_number}.pdf`,
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf'
        }
      ]
    })

    // Update status to SENT
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'SENT' }
    })

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId 
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
