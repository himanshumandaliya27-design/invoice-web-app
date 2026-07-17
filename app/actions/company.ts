'use server'

import { cookies } from 'next/headers'

export async function setActiveCompany(companyId: string) {
  const cookieStore = await cookies()
  cookieStore.set('activeCompanyId', companyId, { 
    path: '/',
    maxAge: 60 * 60 * 24 * 365 // 1 year
  })
}

export async function getActiveCompanyId() {
  const cookieStore = await cookies()
  return cookieStore.get('activeCompanyId')?.value
}
