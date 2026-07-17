import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { TDocumentDefinitions } from 'pdfmake/interfaces'

(pdfMake as any).vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : (pdfFonts as any).vfs;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    // Generate PDF Buffer
    const docDefinition: TDocumentDefinitions = {
      content: [
        {
          columns: [
            company.logo_base64 
              ? { image: company.logo_base64, width: 100 } 
              : { text: company.name, fontSize: 20, bold: true },
            {
              text: 'INVOICE',
              fontSize: 24,
              bold: true,
              alignment: 'right',
              color: '#3b82f6'
            }
          ]
        },
        { text: '\n' },
        {
          columns: [
            {
              text: [
                { text: 'From:\n', bold: true, fontSize: 12 },
                { text: `${company.name}\n`, bold: true },
                `${company.address || ''}\n`,
                company.gstin ? `GSTIN: ${company.gstin}\n` : '',
                company.email ? `Email: ${company.email}\n` : '',
                company.mobile ? `Mobile: ${company.mobile}` : ''
              ]
            },
            {
              text: [
                { text: 'Invoice Details:\n', bold: true, fontSize: 12 },
                `Invoice No: ${invoice.invoice_number}\n`,
                `Date: ${invoice.date.toLocaleDateString('en-IN')}\n`,
                invoice.due_date ? `Due Date: ${invoice.due_date.toLocaleDateString('en-IN')}\n` : ''
              ],
              alignment: 'right'
            }
          ]
        },
        { text: '\n\n' },
        {
          text: [
            { text: 'Bill To:\n', bold: true, fontSize: 12 },
            { text: `${customer.name}\n`, bold: true },
            `${customer.address || ''}\n`,
            customer.gstin ? `GSTIN: ${customer.gstin}\n` : '',
            customer.state ? `State: ${customer.state}` : ''
          ]
        },
        { text: '\n\n' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Item & Description', bold: true, fillColor: '#f3f4f6' },
                { text: 'Qty', bold: true, alignment: 'center', fillColor: '#f3f4f6' },
                { text: 'Rate (Rs)', bold: true, alignment: 'right', fillColor: '#f3f4f6' },
                { text: 'GST %', bold: true, alignment: 'center', fillColor: '#f3f4f6' },
                { text: 'Total (Rs)', bold: true, alignment: 'right', fillColor: '#f3f4f6' }
              ],
              ...(invoice.items.map(item => [
                { stack: [
                  { text: item.item_name, bold: true },
                  item.hsn_sac ? { text: `HSN/SAC: ${item.hsn_sac}`, fontSize: 9, color: 'gray' } : null,
                  item.description ? { text: item.description, fontSize: 9 } : null
                ].filter(Boolean) },
                { text: item.quantity.toString(), alignment: 'center', margin: [0, 5, 0, 0] },
                { text: item.rate.toFixed(2), alignment: 'right', margin: [0, 5, 0, 0] },
                { text: item.tax_rate.toString(), alignment: 'center', margin: [0, 5, 0, 0] },
                { text: item.total_amount.toFixed(2), alignment: 'right', margin: [0, 5, 0, 0] }
              ]) as any[][])
            ]
          },
          layout: 'lightHorizontalLines'
        },
        { text: '\n\n' },
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 250,
              table: {
                widths: ['*', '*'],
                body: [
                  ['Sub Total:', { text: `Rs ${invoice.sub_total.toFixed(2)}`, alignment: 'right' }],
                  ['Total Tax (GST):', { text: `Rs ${invoice.tax_total.toFixed(2)}`, alignment: 'right' }],
                  [
                    { text: 'Grand Total:', bold: true, fontSize: 14, margin: [0, 5, 0, 5] },
                    { text: `Rs ${invoice.grand_total.toFixed(2)}`, bold: true, fontSize: 14, alignment: 'right', margin: [0, 5, 0, 5] }
                  ]
                ]
              },
              layout: 'noBorders'
            }
          ]
        },
        { text: '\n\n' },
        invoice.notes ? { text: [{ text: 'Notes:\n', bold: true }, invoice.notes], margin: [0, 0, 0, 10] } : { text: '' },
        invoice.terms ? { text: [{ text: 'Terms & Conditions:\n', bold: true }, invoice.terms] } : { text: '' }
      ],
      defaultStyle: {
        font: 'Roboto'
      }
    }

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      try {
        const pdfDocGenerator = pdfMake.createPdf(docDefinition as any)
        ;(pdfDocGenerator as any).getBuffer((buffer: Uint8Array) => {
          resolve(Buffer.from(buffer))
        })
      } catch (err) {
        reject(err)
      }
    })

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
