import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveCompanyId } from '@/app/actions/company'

export async function GET() {
  try {
    const companyId = await getActiveCompanyId()
    if (!companyId) return NextResponse.json([])

    const items = await prisma.item.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' }
    })
    return NextResponse.json(items)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const companyId = await getActiveCompanyId()
    if (!companyId) return NextResponse.json({ error: 'No active company' }, { status: 400 })

    const item = await prisma.item.create({
      data: {
        company_id: companyId,
        name: data.name,
        description: data.description || null,
        price: Number(data.price),
        hsn_sac: data.hsn_sac || null,
        tax_rate: Number(data.tax_rate) || 0
      }
    })
    return NextResponse.json(item)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
