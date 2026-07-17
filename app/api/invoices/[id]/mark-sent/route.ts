import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    
    // Update status to SENT
    await prisma.invoice.update({
      where: { id: id },
      data: { status: 'SENT' }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to mark as sent' }, { status: 500 })
  }
}
