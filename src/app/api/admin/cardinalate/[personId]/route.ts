import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'

export async function PUT(req: NextRequest, { params }: { params: { personId: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  const body = await req.json()

  const cardinalate = await prisma.cardinalate.upsert({
    where: { personId: params.personId },
    create: {
      personId:     params.personId,
      dateCreated:  new Date(body.dateCreated),
      cardinalOrder: body.cardinalOrder,
      titularChurch: body.titularChurch || null,
      isElector:    body.isElector ?? false,
      dateEnded:    body.dateEnded ? new Date(body.dateEnded) : null,
      endReason:    body.endReason || null,
    },
    update: {
      dateCreated:  new Date(body.dateCreated),
      cardinalOrder: body.cardinalOrder,
      titularChurch: body.titularChurch || null,
      isElector:    body.isElector ?? false,
      dateEnded:    body.dateEnded ? new Date(body.dateEnded) : null,
      endReason:    body.endReason || null,
    },
  })

  return NextResponse.json(cardinalate)
}

export async function DELETE(_req: NextRequest, { params }: { params: { personId: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  await prisma.cardinalate.delete({ where: { personId: params.personId } })
  return NextResponse.json({ ok: true })
}
