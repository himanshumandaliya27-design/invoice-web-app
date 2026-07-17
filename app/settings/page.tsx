import { prisma } from '@/lib/prisma'
import { getActiveCompanyId } from '@/app/actions/company'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const companies = await prisma.company.findMany({
    orderBy: { created_at: 'desc' }
  })
  
  const currentActive = await getActiveCompanyId()

  const safeCompanies = companies.map(c => ({
    id: c.id,
    name: c.name,
    address: c.address,
    phone: c.phone,
    email: c.email,
    gstin: c.gstin,
    currency: c.currency,
    bank_name: c.bank_name,
    account_number: c.account_number,
    ifsc_code: c.ifsc_code,
    upi_id: c.upi_id,
    smtp_host: c.smtp_host,
    smtp_port: c.smtp_port,
    smtp_user: c.smtp_user,
    smtp_pass: c.smtp_pass
  }))

  return <SettingsClient initialCompanies={safeCompanies} initialActiveId={currentActive || null} />
}
