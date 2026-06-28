import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  const body = await req.json()

  const record = await prisma.education.update({
    where: { id: params.id },
    data: {
      institution:  body.institution  !== undefined ? body.institution          : undefined,
      degree:       body.degree       !== undefined ? (body.degree || null)     : undefined,
      fieldOfStudy: body.fieldOfStudy !== undefined ? (body.fieldOfStudy || null) : undefined,
      startYear:    body.startYear    !== undefined ? (body.startYear ? Number(body.startYear)  : null) : undefined,
      endYear:      body.endYear      !== undefined ? (body.endYear   ? Number(body.endYear)    : null) : undefined,
      ordinal:      body.ordinal      !== undefined ? Number(body.ordinal) : undefined,
    },
  })

  return NextResponse.json(record)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  await prisma.education.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
