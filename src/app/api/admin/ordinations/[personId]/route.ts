import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'

export async function PUT(req: NextRequest, { params }: { params: { personId: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  const body = await req.json()

  const ordination = await prisma.priesthoodOrdination.upsert({
    where: { personId: params.personId },
    create: {
      personId:                       params.personId,
      date:                           new Date(body.date),
      location:                       body.location || null,
      ordainingBishopId:              body.ordainingBishopId || null,
      incardinationSeeId:             body.incardinationSeeId || null,
      ordinationSeeId:                body.ordinationSeeId || null,
      religiousInstituteAtOrdination: body.religiousInstituteAtOrdination || null,
    },
    update: {
      date:                           new Date(body.date),
      location:                       body.location || null,
      ordainingBishopId:              body.ordainingBishopId || null,
      incardinationSeeId:             body.incardinationSeeId || null,
      ordinationSeeId:                body.ordinationSeeId || null,
      religiousInstituteAtOrdination: body.religiousInstituteAtOrdination || null,
    },
  })

  return NextResponse.json(ordination)
}

export async function DELETE(_req: NextRequest, { params }: { params: { personId: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  await prisma.priesthoodOrdination.delete({ where: { personId: params.personId } })
  return NextResponse.json({ ok: true })
}
