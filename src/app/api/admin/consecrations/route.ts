import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { error } = await adminAuthCheck()
  if (error) return error

  const body = await req.json()

  const consecration = await prisma.episcopalConsecration.create({
    data: {
      personId:               body.personId,
      date:                   new Date(body.date),
      location:               body.location || null,
      principalConsecratorId: body.principalConsecratorId || null,
    },
  })

  return NextResponse.json(consecration)
}
