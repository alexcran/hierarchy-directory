import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const orders = await prisma.religiousOrder.findMany({
    orderBy: { fullName: 'asc' },
    select: { id: true, fullName: true, abbreviation: true, commonName: true },
  })
  return NextResponse.json(orders)
}
