import { prisma } from '@/lib/prisma'
import { getActiveCompanyId } from '@/app/actions/company'
import CompanyClient from './CompanyClient'

export const dynamic = 'force-dynamic'

export default async function CompanyPage() {
  const companies = await prisma.company.findMany({
    orderBy: { created_at: 'desc' }
  })
  
  const currentActive = await getActiveCompanyId()

  const safeCompanies = companies.map(c => ({
    id: c.id,
    name: c.name,
    logo_base64: c.logo_base64,
    address: c.address,
    mobile: c.mobile,
    email: c.email,
    gstin: c.gstin,
    smtp_host: c.smtp_host,
    smtp_port: c.smtp_port,
    smtp_user: c.smtp_user,
    smtp_pass: c.smtp_pass
  }))

  return <CompanyClient initialCompanies={safeCompanies} initialActiveId={currentActive || null} />
}
