import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  const body = await req.json()

  const assignment = await prisma.assignment.update({
    where: { id: params.id },
    data: {
      seeId:         body.seeId         !== undefined ? body.seeId         : undefined,
      role:          body.role           !== undefined ? body.role           : undefined,
      titleOverride: body.titleOverride  !== undefined ? (body.titleOverride || null) : undefined,
      startDate:     body.startDate      !== undefined ? new Date(body.startDate) : undefined,
      installedDate: body.installedDate  !== undefined ? (body.installedDate ? new Date(body.installedDate) : null) : undefined,
      endDate:       body.endDate        !== undefined ? (body.endDate ? new Date(body.endDate) : null) : undefined,
      startReason:   body.startReason    !== undefined ? body.startReason   : undefined,
      endReason:     body.endReason      !== undefined ? (body.endReason || null) : undefined,
      isCurrent:     body.isCurrent      !== undefined ? body.isCurrent     : undefined,
    },
  })

  return NextResponse.json(assignment)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  await prisma.assignment.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
