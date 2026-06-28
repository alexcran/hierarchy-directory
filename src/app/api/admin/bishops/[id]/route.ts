import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'
import { optionalDateUpdate, optionalStringUpdate } from '@/lib/admin/validators'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  const body = await req.json()

  const person = await prisma.person.update({
    where: { id: params.id },
    data: {
      firstName:           typeof body.firstName === 'string' ? body.firstName.trim() : undefined,
      middleName:          optionalStringUpdate(body, 'middleName'),
      lastName:            typeof body.lastName  === 'string' ? body.lastName.trim()  : undefined,
      suffix:              optionalStringUpdate(body, 'suffix'),
      religiousOrderId:    'religiousOrderId' in body ? (body.religiousOrderId || null) : undefined,
      styleOfAddress:      optionalStringUpdate(body, 'styleOfAddress'),
      portraitUrl:         optionalStringUpdate(body, 'portraitUrl'),
      photoCredit:         optionalStringUpdate(body, 'photoCredit'),
      dateOfBirth:         optionalDateUpdate(body, 'dateOfBirth'),
      dateOfDeath:         optionalDateUpdate(body, 'dateOfDeath'),
      placeOfBirth:        optionalStringUpdate(body, 'placeOfBirth'),
      catholicHierarchyId: optionalStringUpdate(body, 'catholicHierarchyId'),
      gcatholicId:         optionalStringUpdate(body, 'gcatholicId'),
      wikipediaUrl:        optionalStringUpdate(body, 'wikipediaUrl'),
      motto:               optionalStringUpdate(body, 'motto'),
      diocesanBioUrl:      optionalStringUpdate(body, 'diocesanBioUrl'),
    },
  })

  return NextResponse.json({ ok: true, id: person.id })
}
