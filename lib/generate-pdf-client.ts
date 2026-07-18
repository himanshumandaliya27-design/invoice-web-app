import jsPDF from 'jspdf'
import QRCode from 'qrcode'

// Helper to convert number to words
function numberToWords(num: number): string {
  const a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen ']
  const b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety']
  if ((num = num.toString()).length > 9) return 'overflow'
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/)
  if (!n) return ''
  let str = ''
  str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : ''
  str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : ''
  str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : ''
  str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : ''
  str += (Number(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'only' : 'only'
  return str.trim().toUpperCase()
}

export async function generateInvoicePDF(invoice: any, output: 'download' | 'blob' | 'datauristring' = 'download') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  
  const primaryColor = [242, 116, 21] // Orange #F27415
  const secondaryColor = [31, 46, 117] // Dark Blue #1F2E75

  // 1. Draw Background Template if available
  if (invoice.company.template_base64) {
    try {
      const format = invoice.company.template_base64.includes('image/png') ? 'PNG' : 'JPEG'
      doc.addImage(invoice.company.template_base64, format, 0, 0, 210, 297)
    } catch (e) {
      console.error('Error drawing template', e)
    }
  }

  // 2. INVOICE Pill
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.roundedRect(85, 5, 40, 8, 4, 4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', 105, 10.5, { align: 'center' })

  // 3. Header: Logo & Company Name
  if (invoice.company.logo_base64) {
    try {
      const format = invoice.company.logo_base64.includes('image/png') ? 'PNG' : 'JPEG'
      const props = doc.getImageProperties(invoice.company.logo_base64)
      const ratio = props.width / props.height
      let imgWidth = 35
      let imgHeight = imgWidth / ratio
      if (imgHeight > 25) {
        imgHeight = 25
        imgWidth = imgHeight * ratio
      }
      doc.addImage(invoice.company.logo_base64, format, 15, 15, imgWidth, imgHeight)
    } catch (e) {
      console.error('Error adding logo to PDF', e)
    }
  }

  // Company Name - we use standard font since Aclonica isn't built into jsPDF
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.company.name.toUpperCase(), 195, 25, { align: 'right' })
  
  // Tagline & Website
  doc.setFontSize(9)
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
  doc.text('Innovate | Integrate | Elevate', 195, 30, { align: 'right' })
  doc.setTextColor(200, 0, 0)
  doc.text(invoice.company.email?.replace('@', '') || 'www.fusionenterprise0808.in', 195, 35, { align: 'right' })

  // 4. Customer Details Box
  const boxY = 45
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
  doc.setLineWidth(0.5)
  doc.roundedRect(12, boxY, 186, 25, 3, 3, 'S')
  
  // Vertical line split
  doc.line(145, boxY, 145, boxY + 25)
  // Horizontal lines inside split
  doc.line(145, boxY + 12.5, 198, boxY + 12.5)

  // Customer Text
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('To,', 14, boxY + 6)
  
  // Underlines for customer
  doc.setLineWidth(0.2)
  doc.line(22, boxY + 6, 140, boxY + 6)
  doc.line(14, boxY + 14, 140, boxY + 14)
  doc.line(14, boxY + 22, 140, boxY + 22)

  // Fill customer details
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(invoice.customer.name, 23, boxY + 5)
  doc.setFont('helvetica', 'normal')
  if (invoice.customer.address) {
    doc.text(invoice.customer.address.substring(0, 70), 15, boxY + 13)
  }
  if (invoice.customer.mobile) {
    doc.text(`Mo: ${invoice.customer.mobile}`, 15, boxY + 21)
  }

  // Right side (Invoice No & Date)
  doc.setFont('helvetica', 'bold')
  doc.text('Invoice No.', 148, boxY + 8)
  doc.setFont('helvetica', 'normal')
  doc.text(invoice.invoice_number, 175, boxY + 8)

  doc.setFont('helvetica', 'bold')
  doc.text('Date :', 148, boxY + 20)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date(invoice.date).toLocaleDateString('en-IN'), 165, boxY + 20)

  // 5. Items Table
  const tableY = boxY + 30
  const tableH = 150
  
  // Outer Table Box
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
  doc.setLineWidth(0.5)
  doc.roundedRect(12, tableY, 186, tableH, 3, 3, 'S')
  
  // Header line
  doc.line(12, tableY + 8, 198, tableY + 8)
  
  // Vertical Columns
  const c1 = 22  // Sr
  const c2 = 135 // Description
  const c3 = 155 // Qty
  const c4 = 175 // Rate
  // Amount is the rest

  doc.line(c1, tableY, c1, tableY + tableH)
  doc.line(c2, tableY, c2, tableY + tableH)
  doc.line(c3, tableY, c3, tableY + tableH)
  doc.line(c4, tableY, c4, tableY + tableH)

  // Header Text
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Sr.', 14, tableY + 6)
  doc.text('Description', c1 + 45, tableY + 6, { align: 'center' })
  doc.text('Qty.', c2 + 10, tableY + 6, { align: 'center' })
  doc.text('Rate', c3 + 10, tableY + 6, { align: 'center' })
  doc.text('Amount', c4 + 11.5, tableY + 6, { align: 'center' })

  // Body Text
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  let rowY = tableY + 14
  invoice.items.forEach((item: any, i: number) => {
    doc.text((i + 1).toString(), 17, rowY, { align: 'center' })
    
    // Description could be long, split it
    const descLines = doc.splitTextToSize(item.item_name + (item.description ? ` - ${item.description}` : ''), c2 - c1 - 4)
    doc.text(descLines, c1 + 2, rowY)
    
    doc.text(item.quantity.toString(), c2 + 10, rowY, { align: 'center' })
    doc.text(item.rate.toFixed(2), c3 + 10, rowY, { align: 'center' })
    doc.text(item.total_amount.toFixed(2), c4 + 21, rowY, { align: 'right' })
    
    rowY += descLines.length * 5
  })

  // Amount In Words & Total Line
  const totalY = tableY + tableH - 8
  doc.line(12, totalY, 198, totalY) // Horizontal above Total

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Amount in words :', 14, totalY + 5.5)
  
  // Number to Words
  const amountWords = numberToWords(Math.round(invoice.grand_total))
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(amountWords, 48, totalY + 5.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL', c3 + 10, totalY + 5.5, { align: 'center' })
  doc.text(invoice.grand_total.toFixed(2), c4 + 21, totalY + 5.5, { align: 'right' })

  // 6. Footer Details
  const footerY = tableY + tableH + 5
  
  // Bank Details
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.circle(18, footerY + 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  // Little logo or bank icon inside circle is skipped, we use circle
  
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(invoice.company.bank_name || 'BANK DETAILS', 23, footerY + 4)
  
  doc.setTextColor(200, 0, 0)
  doc.setFontSize(8)
  doc.text('(FOR CHEQUE PAYMENT PLEASE USE THIS NAME)', 23, footerY + 8)

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.text(invoice.company.account_name || 'Account Name', 23, footerY + 13)
  
  doc.setFontSize(10)
  doc.text(`Mo. ${invoice.company.mobile || ''}`, 23, footerY + 18)
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(`A/C. No. ${invoice.company.account_number || ''}`, 23, footerY + 23)
  doc.text(`IFSC Code : ${invoice.company.ifsc_code || ''}`, 23, footerY + 27)
  doc.text(`Branch : ${invoice.company.branch || ''}`, 23, footerY + 31)

  // Terms & Conditions
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.text('Terms & Condition.', 14, footerY + 36)
  doc.text('Goods once sold will not be taken back', 14, footerY + 38)
  doc.text('E.& O.E', 14, footerY + 40)

  // Authorised Sign
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Authorised Sign', 175, footerY + 4, { align: 'center' })
  doc.text(`For, ${invoice.company.name.toUpperCase()}`, 175, footerY + 30, { align: 'center' })
  
  // We can just draw a fake signature or leave space
  // doc.text('Signature Here', 175, footerY + 20, { align: 'center' })

  // Generate QR Code if UPI ID is present
  if (invoice.company.upi_id) {
    try {
      // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT
      const upiStr = `upi://pay?pa=${invoice.company.upi_id}&pn=${invoice.company.name}&am=${invoice.grand_total.toFixed(2)}`
      const qrDataUrl = await QRCode.toDataURL(upiStr, { margin: 1, scale: 4 })
      doc.addImage(qrDataUrl, 'PNG', 85, footerY + 2, 25, 25)
    } catch (e) {
      console.error('Error generating QR code', e)
    }
  }

  // 7. Bottom Services Bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.roundedRect(85, 260, 40, 6, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('OUR SERVICES', 105, 264.5, { align: 'center' })

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
  doc.setFontSize(8)
  const servicesList = invoice.company.services_list || 'EVENT ORGANIZER \u2666 PRINTING GOODS \u2666 CORPORATE GIFTS'
  doc.text(servicesList, 105, 271, { align: 'center' })

  // Footer orange bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 276, 210, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text(`${invoice.company.address || ''}   E-mail: ${invoice.company.email || ''}`, 105, 282, { align: 'center' })

  // Output
  if (output === 'blob') {
    return doc.output('blob')
  }
  if (output === 'datauristring') {
    return doc.output('datauristring')
  }

  doc.save(`Invoice-${invoice.invoice_number}.pdf`)
}
