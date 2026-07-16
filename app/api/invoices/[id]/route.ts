import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: (await params).id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true,
        company: true
      }
    })
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(invoice)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { status } = await request.json()
    const existing = await prisma.invoice.findUnique({ where: { id: (await params).id } })
    if (existing?.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot modify a cancelled invoice.' }, { status: 400 })
    }

    const invoice = await prisma.invoice.update({
      where: { id: (await params).id },
      data: { status },
    })
    return NextResponse.json(invoice)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const existing = await prisma.invoice.findUnique({ where: { id: (await params).id } })
    if (existing?.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot delete a cancelled invoice.' }, { status: 400 })
    }

    await prisma.invoice.delete({
      where: { id: (await params).id },
    })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
