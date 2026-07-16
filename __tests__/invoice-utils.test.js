import test from 'node:test'
import assert from 'node:assert'
// Note: In a real Next.js environment, we would use Jest with TS compilation.
// This is a native Node test for demonstration purposes.

// Mock implementation of calculateTaxes for the test
function calculateTaxes(items, companyStateCode, customerStateCode) {
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

test('calculateTaxes - Intra-state (CGST/SGST)', () => {
  const items = [
    { product_id: '1', quantity: 2, rate: 100.5, tax_rate: 18 }
  ]
  const result = calculateTaxes(items, '27', '27') // Both Maharashtra

  // itemSubTotal = 2 * 100.5 = 201
  // taxAmount = 201 * 0.18 = 36.18
  // cgst = 18.09, sgst = 18.09, igst = 0
  
  assert.strictEqual(result.calculatedItems[0].cgst_amount, 18.09)
  assert.strictEqual(result.calculatedItems[0].sgst_amount, 18.09)
  assert.strictEqual(result.calculatedItems[0].igst_amount, 0)
  assert.strictEqual(result.sub_total, 201)
  assert.strictEqual(result.tax_total, 36.18)
  assert.strictEqual(result.grand_total, 237.18)
})

test('calculateTaxes - Inter-state (IGST)', () => {
  const items = [
    { product_id: '1', quantity: 1, rate: 500, tax_rate: 12 }
  ]
  const result = calculateTaxes(items, '27', '29') // MH to KA

  // itemSubTotal = 500
  // taxAmount = 60
  // igst = 60
  
  assert.strictEqual(result.calculatedItems[0].cgst_amount, 0)
  assert.strictEqual(result.calculatedItems[0].sgst_amount, 0)
  assert.strictEqual(result.calculatedItems[0].igst_amount, 60)
  assert.strictEqual(result.grand_total, 560)
})

test('calculateTaxes - Floating point rounding precision', () => {
  const items = [
    { product_id: '1', quantity: 1, rate: 10.005, tax_rate: 10 }
  ]
  const result = calculateTaxes(items, '27', '29')

  // rate = 10.005
  // sub_total = 10.01 (rounded)
  // taxAmount = 10.01 * 0.10 = 1.001 -> 1.00 (rounded)
  
  assert.strictEqual(result.calculatedItems[0].sub_total, 10.01)
  assert.strictEqual(result.calculatedItems[0].tax_amount, 1.00)
  assert.strictEqual(result.grand_total, 11.01)
})
