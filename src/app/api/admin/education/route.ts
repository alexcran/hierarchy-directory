import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { error } = await adminAuthCheck()
  if (error) return error

  const body = await req.json()

  const record = await prisma.education.create({
    data: {
      personId:    body.personId,
      institution: body.institution,
      degree:      body.degree      || null,
      fieldOfStudy: body.fieldOfStudy || null,
      startYear:   body.startYear   ? Number(body.startYear)  : null,
      endYear:     body.endYear     ? Number(body.endYear)    : null,
      ordinal:     body.ordinal     ?? 0,
    },
  })

  return NextResponse.json(record)
}
