import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding initial data...')

  // Seed default company if not exists
  const companyCount = await prisma.company.count()
  if (companyCount === 0) {
    await prisma.company.create({
      data: {
        name: 'My Invoice Company',
        gstin: '27AAAAA0000A1Z5',
        currency: 'INR',
        bank_name: 'HDFC Bank',
        account_number: '50100123456789',
        ifsc_code: 'HDFC0001234',
        upi_id: 'merchant@upi'
      }
    })
    console.log('Created default company.')
  }

  // Seed some dummy products with standard GST rates
  const productCount = await prisma.product.count()
  if (productCount === 0) {
    await prisma.product.createMany({
      data: [
        { name: 'Web Development Services', description: 'Custom website development', price: 50000, hsn_sac_code: '998314', tax_rate: 18 },
        { name: 'SEO Optimization', description: 'Monthly SEO services', price: 15000, hsn_sac_code: '998315', tax_rate: 18 },
        { name: 'Hosting (Basic)', description: 'Annual web hosting', price: 5000, hsn_sac_code: '998316', tax_rate: 18 },
      ]
    })
    console.log('Created initial products.')
  }
  
  // Seed some dummy customers (intra-state and inter-state)
  const customerCount = await prisma.customer.count()
  if (customerCount === 0) {
    await prisma.customer.createMany({
      data: [
        { name: 'IntraState Client Pvt Ltd', email: 'client1@example.com', phone: '9876543210', address: 'Mumbai, Maharashtra', gstin: '27BBBBB0000B1Z5', state: '27' },
        { name: 'InterState Client Pvt Ltd', email: 'client2@example.com', phone: '8765432109', address: 'Delhi', gstin: '07CCCCC0000C1Z5', state: '07' },
      ]
    })
    console.log('Created initial customers.')
  }

  console.log('Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
