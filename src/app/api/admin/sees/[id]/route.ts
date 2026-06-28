import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'
import { optionalBooleanUpdate, optionalDateUpdate, optionalStringUpdate } from '@/lib/admin/validators'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  const body = await req.json()

  const see = await prisma.see.update({
    where: { id: params.id },
    data: {
      name:               'name'               in body ? (typeof body.name === 'string' ? body.name.trim() : undefined) : undefined,
      seeType:            'seeType'            in body ? (typeof body.seeType === 'string' ? body.seeType : undefined) : undefined,
      namePrefixOverride: optionalStringUpdate(body, 'namePrefixOverride'),
      stateRegion:        optionalStringUpdate(body, 'stateRegion'),
      isMetropolitan:     optionalBooleanUpdate(body, 'isMetropolitan'),
      metropolitanSeeId:  optionalStringUpdate(body, 'metropolitanSeeId'),
      dateErected:        optionalDateUpdate(body, 'dateErected'),
      dateSuppressed:     optionalDateUpdate(body, 'dateSuppressed'),
      cathedralName:      optionalStringUpdate(body, 'cathedralName'),
      coCathedralName:    optionalStringUpdate(body, 'coCathedralName'),
      cathedralAddress:   optionalStringUpdate(body, 'cathedralAddress'),
      latinName:          optionalStringUpdate(body, 'latinName'),
      coatOfArmsUrl:      optionalStringUpdate(body, 'coatOfArmsUrl'),
      countryId:          optionalStringUpdate(body, 'countryId'),
      riteId:             'riteId'             in body ? (typeof body.riteId === 'string' && body.riteId ? body.riteId : undefined) : undefined,
    },
  })

  return NextResponse.json({ ok: true, id: see.id })
}
