import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { error } = await adminAuthCheck()
  if (error) return error

  const body = await req.json()

  const assignment = await prisma.assignment.create({
    data: {
      personId:      body.personId,
      seeId:         body.seeId,
      role:          body.role,
      titleOverride: body.titleOverride || null,
      startDate:     new Date(body.startDate),
      installedDate: body.installedDate ? new Date(body.installedDate) : null,
      endDate:       body.endDate ? new Date(body.endDate) : null,
      startReason:   body.startReason,
      endReason:     body.endReason || null,
      isCurrent:     body.isCurrent ?? true,
    },
  })

  return NextResponse.json(assignment)
}
