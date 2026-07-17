import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id
    const invoice = await prisma.invoice.findUnique({
      where: { id: id },
      include: {
        customer: true,
        company: true
      }
    })
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!invoice.customer.email) return NextResponse.json({ error: 'Customer has no email' }, { status: 400 })

    if (!invoice.company.smtp_user || !invoice.company.smtp_pass) {
      return NextResponse.json({ error: 'Email setup is missing in Company Settings. Please add SMTP credentials first.' }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host: invoice.company.smtp_host || 'smtp.gmail.com',
      port: invoice.company.smtp_port || 587,
      secure: invoice.company.smtp_port === 465,
      auth: {
        user: invoice.company.smtp_user,
        pass: invoice.company.smtp_pass,
      },
    })

    // Fetch PDF from our own endpoint (simulated here by generating the URL)
    const host = request.headers.get('host')
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    const pdfUrl = `${protocol}://${host}/api/invoices/${invoice.id}/pdf`
    
    const pdfResponse = await fetch(pdfUrl)
    const pdfBuffer = await pdfResponse.arrayBuffer()

    const info = await transporter.sendMail({
      from: `"${invoice.company.name}" <${invoice.company.smtp_user}>`,
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
    return NextResponse.json({ error: 'Failed to send email. Please check your SMTP settings.' }, { status: 500 })
  }
}
