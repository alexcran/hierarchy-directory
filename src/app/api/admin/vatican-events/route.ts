import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { error } = await adminAuthCheck()
  if (error) return error

  const body = await req.json()

  const event = await prisma.vaticanEvent.create({
    data: {
      personId:    body.personId,
      eventType:   body.eventType,
      eventDate:   new Date(body.eventDate),
      eventEndDate: body.eventEndDate ? new Date(body.eventEndDate) : null,
      description: body.description || null,
    },
  })

  return NextResponse.json(event)
}
