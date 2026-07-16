import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: (await params).id },
    })
    if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(company)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const json = await request.json()
    const company = await prisma.company.update({
      where: { id: (await params).id },
      data: json,
    })
    return NextResponse.json(company)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await prisma.company.delete({
      where: { id: (await params).id },
    })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
  }
}
