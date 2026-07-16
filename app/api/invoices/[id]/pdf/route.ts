import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import puppeteer from 'puppeteer'

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

    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    
    // Formatting date
    const formatDate = (dateString: Date) => {
      return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    const htmlContent = `
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; font-size: 13px; color: #333; margin: 40px; background: white; line-height: 1.5; }
            
            /* Typography & Colors */
            .text-bold { font-weight: 700; }
            .text-primary { color: #0033a0; }
            .text-dark { color: #1a1a1a; }
            .text-gray { color: #555; }
            .uppercase { text-transform: uppercase; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            /* Layout */
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .mb-8 { margin-bottom: 32px; }
            .mt-1 { margin-top: 4px; }
            .mt-2 { margin-top: 8px; }
            .mt-3 { margin-top: 12px; }
            .pt-4 { padding-top: 16px; }
            .pb-2 { padding-bottom: 8px; }
            .pb-3 { padding-bottom: 12px; }
            
            /* Boxes */
            .box-gray { background: #f8f9fa; border: 1px solid #e9ecef; padding: 16px; }
            .box-title { font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #0033a0; margin-top: 0; margin-bottom: 8px; }
            
            /* Header */
            .header-left { width: 50%; }
            .header-right { width: 300px; }
            .company-name { font-size: 20px; font-weight: 700; color: #1a1a1a; margin-top: 0; margin-bottom: 4px; }
            .logo { height: 50px; margin-bottom: 16px; object-fit: contain; }
            .tax-invoice-title { font-size: 28px; font-weight: 700; color: #0033a0; margin: 0 0 16px 0; letter-spacing: 0.02em; }
            
            /* Grid */
            .grid-2 { display: table; width: 100%; table-layout: fixed; margin-bottom: 32px; border-spacing: 24px 0; }
            .grid-2 > div { display: table-cell; width: 50%; }
            
            /* Table */
            table { width: 100%; border-collapse: collapse; border: 1px solid #e9ecef; margin-bottom: 32px; }
            th { background: #f0f4f8; padding: 12px; font-size: 11px; font-weight: 700; color: #0033a0; border-bottom: 1px solid #e9ecef; }
            td { padding: 12px; border-bottom: 1px solid #e9ecef; }
            tr:last-child td { border-bottom: none; }
            
            /* Totals */
            .totals-container { display: flex; justify-content: flex-end; margin-bottom: 32px; }
            .totals-box { width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
            .grand-total { border-bottom: 2px solid #1a1a1a; background: #f8f9fa; padding: 12px 8px; margin-top: 8px; font-size: 16px; }
          </style>
        </head>
        <body>
          
          <div class="flex justify-between mb-8">
            <div class="header-left">
              ${invoice.company.logo_url ? `<img src="${invoice.company.logo_url}" class="logo" />` : ''}
              <h2 class="company-name">${invoice.company.name}</h2>
              <div class="text-gray">
                ${invoice.company.address ? `<div style="white-space: pre-wrap;">${invoice.company.address}</div>` : ''}
                <div class="mt-2"><strong class="text-dark">GSTIN:</strong> ${invoice.company.gstin}</div>
                ${invoice.company.phone ? `<div><strong class="text-dark">Phone:</strong> ${invoice.company.phone}</div>` : ''}
                ${invoice.company.email ? `<div><strong class="text-dark">Email:</strong> ${invoice.company.email}</div>` : ''}
              </div>
            </div>
            
            <div class="header-right">
              <h1 class="tax-invoice-title text-right uppercase">TAX INVOICE</h1>
              
              <div class="box-gray text-dark">
                <div class="flex justify-between mb-2">
                  <span class="text-gray uppercase text-bold" style="font-size: 11px; width: 130px;">INVOICE NO</span>
                  <span class="text-bold text-right">${invoice.invoice_number}</span>
                </div>
                <div class="flex justify-between mb-2">
                  <span class="text-gray uppercase text-bold" style="font-size: 11px; width: 130px;">INVOICE DATE</span>
                  <span class="text-bold text-right">${formatDate(invoice.date)}</span>
                </div>
                ${invoice.due_date ? `
                <div class="flex justify-between mb-2">
                  <span class="text-gray uppercase text-bold" style="font-size: 11px; width: 130px;">DUE DATE</span>
                  <span class="text-bold text-right">${formatDate(invoice.due_date)}</span>
                </div>
                ` : ''}
                ${invoice.place_of_supply ? `
                <div class="flex justify-between">
                  <span class="text-gray uppercase text-bold" style="font-size: 11px; width: 130px;">PLACE OF SUPPLY</span>
                  <span class="text-bold text-right">${invoice.place_of_supply}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div style="margin-left: -24px; margin-right: -24px;">
            <div class="grid-2">
              <div>
                <div class="box-gray">
                  <h3 class="box-title uppercase">BILLED TO</h3>
                  <div class="text-bold text-dark mb-1" style="font-size: 14px;">${invoice.customer.name}</div>
                  ${invoice.customer.address ? `<div class="text-gray mb-1" style="white-space: pre-wrap; line-height: 1.3;">${invoice.customer.address}</div>` : ''}
                  ${invoice.customer.gstin ? `<div class="mt-3 text-dark"><strong class="text-dark">GSTIN:</strong> ${invoice.customer.gstin}</div>` : ''}
                  ${invoice.customer.phone ? `<div class="mt-1 text-gray">Phone: ${invoice.customer.phone}</div>` : ''}
                  ${invoice.customer.email ? `<div class="text-gray">Email: ${invoice.customer.email}</div>` : ''}
                </div>
              </div>

              <div>
                <div class="box-gray">
                  <h3 class="box-title uppercase">SHIPPED TO</h3>
                  <div class="text-bold text-dark mb-1" style="font-size: 14px;">${invoice.customer.name}</div>
                  ${invoice.customer.address ? `<div class="text-gray mb-1" style="white-space: pre-wrap; line-height: 1.3;">${invoice.customer.address}</div>` : ''}
                  ${invoice.customer.state ? `<div class="mt-3 text-dark"><strong class="text-dark">State Code:</strong> ${invoice.customer.state}</div>` : ''}
                </div>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="text-left" style="width: 5%;">#</th>
                <th class="text-left" style="width: 35%;">DESCRIPTION OF GOODS/SERVICES</th>
                <th class="text-center" style="width: 15%;">HSN/SAC</th>
                <th class="text-right" style="width: 10%;">QTY</th>
                <th class="text-right" style="width: 12%;">RATE (₹)</th>
                <th class="text-right" style="width: 8%;">GST %</th>
                <th class="text-right" style="width: 15%;">AMOUNT (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item, idx) => `
                <tr>
                  <td class="text-gray">${idx + 1}</td>
                  <td class="text-dark">
                    <div class="text-bold">${item.product.name}</div>
                    ${item.product.description ? `<div class="text-gray" style="font-size: 11px; margin-top: 4px;">${item.product.description}</div>` : ''}
                  </td>
                  <td class="text-gray text-center" style="background: #f8f9fa;">${item.product.hsn_sac_code || '-'}</td>
                  <td class="text-dark text-right">${item.quantity}</td>
                  <td class="text-dark text-right">${item.rate.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  <td class="text-dark text-right">${item.tax_rate}%</td>
                  <td class="text-dark text-bold text-right">${item.total_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals-container">
            <div class="totals-box">
              <div class="total-row">
                <span class="text-gray text-bold">Sub Total</span>
                <span class="text-bold text-dark">₹ ${invoice.sub_total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
              <div class="total-row">
                <span class="text-gray text-bold">Tax Total</span>
                <span class="text-bold text-dark">₹ ${invoice.tax_total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
              <div class="total-row grand-total">
                <span class="text-primary text-bold">Grand Total</span>
                <span class="text-dark text-bold">₹ ${invoice.grand_total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>
          
          ${(invoice.notes || invoice.terms_conditions) ? `
          <div style="border-top: 1px solid #e9ecef; padding-top: 16px; margin-top: 16px;">
            <div style="display: table; width: 100%; table-layout: fixed; border-spacing: 24px 0; margin-left: -24px; margin-right: -24px;">
              ${invoice.notes ? `
              <div style="display: table-cell; width: 50%;">
                <h4 class="text-primary uppercase text-bold mb-2" style="font-size: 11px; letter-spacing: 0.05em; margin: 0 0 8px 0;">Notes</h4>
                <div class="text-gray" style="white-space: pre-wrap; font-size: 11px; line-height: 1.5;">${invoice.notes}</div>
              </div>
              ` : '<div></div>'}
              
              ${invoice.terms_conditions ? `
              <div style="display: table-cell; width: 50%;">
                <h4 class="text-primary uppercase text-bold mb-2" style="font-size: 11px; letter-spacing: 0.05em; margin: 0 0 8px 0;">Terms & Conditions</h4>
                <div class="text-gray" style="white-space: pre-wrap; font-size: 11px; line-height: 1.5;">${invoice.terms_conditions}</div>
              </div>
              ` : '<div></div>'}
            </div>
          </div>
          ` : ''}

        </body>
      </html>
    `

    await page.setContent(htmlContent)
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()

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
