import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generateInvoicePDF(invoice: any, output: 'download' | 'blob' | 'datauristring' = 'download') {
  const doc = new jsPDF()

  // Company details
  let currentY = 14
  
  if (invoice.company.logo_base64) {
    try {
      const format = invoice.company.logo_base64.includes('image/png') ? 'PNG' : 'JPEG'
      const props = doc.getImageProperties(invoice.company.logo_base64)
      const ratio = props.width / props.height
      let imgWidth = 50
      let imgHeight = imgWidth / ratio
      if (imgHeight > 20) {
        imgHeight = 20
        imgWidth = imgHeight * ratio
      }
      doc.addImage(invoice.company.logo_base64, format, 14, currentY, imgWidth, imgHeight)
      currentY += imgHeight + 6
    } catch (e) {
      console.error('Error adding logo to PDF', e)
    }
  }
  
  doc.setFontSize(20)
  doc.text(invoice.company.name, 14, currentY + 6)
  currentY += 12
  
  doc.setFontSize(10)
  doc.setTextColor(100)
  
  if (invoice.company.address) {
    doc.text(invoice.company.address, 14, currentY)
    currentY += 5
  }
  if (invoice.company.gstin) {
    doc.text(`GSTIN: ${invoice.company.gstin}`, 14, currentY)
    currentY += 5
  }
  
  // Invoice title
  doc.setFontSize(24)
  doc.setTextColor(59, 130, 246) // Blue
  doc.text('INVOICE', 196, 22, { align: 'right' })
  
  doc.setFontSize(10)
  doc.setTextColor(0)
  doc.text(`Invoice No: ${invoice.invoice_number}`, 196, 30, { align: 'right' })
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString('en-IN')}`, 196, 35, { align: 'right' })
  if (invoice.due_date) {
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-IN')}`, 196, 40, { align: 'right' })
  }

  // Bill To
  let billToY = Math.max(currentY + 10, 55)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Bill To:', 14, billToY)
  doc.setFont('helvetica', 'normal')
  billToY += 7
  doc.setFontSize(10)
  doc.text(invoice.customer.name, 14, billToY)
  billToY += 5
  if (invoice.customer.address) {
    doc.text(invoice.customer.address, 14, billToY)
    billToY += 5
  }
  if (invoice.customer.gstin) {
    doc.text(`GSTIN: ${invoice.customer.gstin}`, 14, billToY)
    billToY += 5
  }

  // Items table
  autoTable(doc, {
    startY: billToY + 5,
    head: [['Item & Description', 'Qty', 'Rate (Rs)', 'GST %', 'Total (Rs)']],
    body: invoice.items.map((item: any) => [
      item.item_name + (item.description ? `\n${item.description}` : '') + (item.hsn_sac ? `\nHSN: ${item.hsn_sac}` : ''),
      item.quantity,
      item.rate.toFixed(2),
      item.tax_rate,
      item.total_amount.toFixed(2)
    ]),
    theme: 'striped',
    headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0] },
    styles: { fontSize: 9 }
  })

  const finalY = (doc as any).lastAutoTable.finalY || yPos + 30

  // Totals
  doc.text('Sub Total:', 140, finalY + 10)
  doc.text(`Rs ${invoice.sub_total.toFixed(2)}`, 196, finalY + 10, { align: 'right' })
  
  doc.text('Total Tax (GST):', 140, finalY + 17)
  doc.text(`Rs ${invoice.tax_total.toFixed(2)}`, 196, finalY + 17, { align: 'right' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Grand Total:', 140, finalY + 27)
  doc.text(`Rs ${invoice.grand_total.toFixed(2)}`, 196, finalY + 27, { align: 'right' })

  // Notes
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  currentY = finalY + 40
  if (invoice.notes) {
    doc.setFont('helvetica', 'bold')
    doc.text('Notes:', 14, currentY)
    doc.setFont('helvetica', 'normal')
    doc.text(invoice.notes, 14, currentY + 5)
    currentY += 15
  }
  
  if (invoice.terms) {
    doc.setFont('helvetica', 'bold')
    doc.text('Terms & Conditions:', 14, currentY)
    doc.setFont('helvetica', 'normal')
    doc.text(invoice.terms, 14, currentY + 5)
  }

  if (output === 'blob') {
    return doc.output('blob')
  }
  if (output === 'datauristring') {
    return doc.output('datauristring')
  }

  doc.save(`Invoice-${invoice.invoice_number}.pdf`)
}
