import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  const body = await req.json()

  const event = await prisma.vaticanEvent.update({
    where: { id: params.id },
    data: {
      eventType:    body.eventType   !== undefined ? body.eventType   : undefined,
      eventDate:    body.eventDate   !== undefined ? new Date(body.eventDate) : undefined,
      eventEndDate: body.eventEndDate !== undefined ? (body.eventEndDate ? new Date(body.eventEndDate) : null) : undefined,
      description:  body.description !== undefined ? (body.description || null) : undefined,
    },
  })

  return NextResponse.json(event)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  await prisma.vaticanEvent.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
