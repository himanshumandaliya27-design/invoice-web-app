import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { created_at: 'desc' }
    })
    return NextResponse.json(companies)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const company = await prisma.company.create({
      data: {
        name: data.name,
        logo_base64: data.logo_base64 || null,
        address: data.address || null,
        mobile: data.mobile || null,
        email: data.email || null,
        gstin: data.gstin || null,
        smtp_host: data.smtp_host || null,
        smtp_port: data.smtp_port ? Number(data.smtp_port) : null,
        smtp_user: data.smtp_user || null,
        smtp_pass: data.smtp_pass || null,
      }
    })
    return NextResponse.json(company)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
