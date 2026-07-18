import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    
    const company = await prisma.company.update({
      where: { id },
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
        bank_name: data.bank_name || null,
        account_name: data.account_name || null,
        account_number: data.account_number || null,
        ifsc_code: data.ifsc_code || null,
        branch: data.branch || null,
        upi_id: data.upi_id || null,
        services_list: data.services_list || null,
        template_base64: data.template_base64 || null,
      }
    })
    return NextResponse.json(company)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.company.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
