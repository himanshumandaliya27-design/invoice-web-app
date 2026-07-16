import { prisma } from '@/lib/prisma'

export async function generateInvoiceNumber(companyId: string): Promise<string> {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  let financialYear = ''
  
  if (currentMonth >= 4) {
    financialYear = `${currentYear}-${(currentYear + 1).toString().slice(2)}`
  } else {
    financialYear = `${currentYear - 1}-${currentYear.toString().slice(2)}`
  }

  const latestInvoice = await prisma.invoice.findFirst({
    where: {
      company_id: companyId,
      invoice_number: {
        startsWith: `INV-${financialYear}-`
      }
    },
    orderBy: {
      invoice_number: 'desc'
    }
  })

  let nextSequence = 1
  if (latestInvoice) {
    const parts = latestInvoice.invoice_number.split('-')
    const lastSequence = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(lastSequence)) {
      nextSequence = lastSequence + 1
    }
  }

  const sequenceStr = nextSequence.toString().padStart(3, '0')
  return `INV-${financialYear}-${sequenceStr}`
}

export function calculateTaxes(items: any[], companyStateCode: string, customerStateCode: string) {
  const isInterState = companyStateCode !== customerStateCode

  let sub_total = 0
  let tax_total = 0
  let grand_total = 0

  const calculatedItems = items.map(item => {
    const itemSubTotal = Math.round((item.quantity * item.rate) * 100) / 100
    const taxAmount = Math.round((itemSubTotal * (item.tax_rate / 100)) * 100) / 100
    
    let cgst_amount = 0
    let sgst_amount = 0
    let igst_amount = 0

    if (isInterState) {
      igst_amount = taxAmount
    } else {
      cgst_amount = Math.round((taxAmount / 2) * 100) / 100
      sgst_amount = Math.round((taxAmount / 2) * 100) / 100
    }

    const itemTotal = Math.round((itemSubTotal + taxAmount) * 100) / 100

    sub_total += itemSubTotal
    tax_total += taxAmount
    grand_total += itemTotal

    return {
      ...item,
      sub_total: itemSubTotal,
      tax_amount: taxAmount,
      cgst_amount,
      sgst_amount,
      igst_amount,
      total_amount: itemTotal
    }
  })

  return {
    calculatedItems,
    sub_total: Math.round(sub_total * 100) / 100,
    tax_total: Math.round(tax_total * 100) / 100,
    grand_total: Math.round(grand_total * 100) / 100
  }
}

export function numberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString().replace(/[\, ]/g, '') as any) != parseFloat(num as any)) return '';
  let n = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != '00') ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + 'Crore ' : '';
  str += (n[2] != '00') ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + 'Lakh ' : '';
  str += (n[3] != '00') ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + 'Thousand ' : '';
  str += (n[4] != '0') ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + 'Hundred ' : '';
  str += (n[5] != '00') ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]) + 'Only ' : '';
  return str.trim();
}
