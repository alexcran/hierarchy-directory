import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'
import { optionalString, stringArray } from '@/lib/admin/validators'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  const body = await req.json()
  const coConsecrators = Array.isArray(body.coConsecrators)
    ? stringArray(body.coConsecrators, 'coConsecrators')
    : null

  const consecration = await prisma.$transaction(async (tx) => {
    if (coConsecrators) {
      await tx.episcopalConsecrationCoConsecrator.deleteMany({
        where: { consecrationId: params.id },
      })
      if (coConsecrators.length > 0) {
        await tx.episcopalConsecrationCoConsecrator.createMany({
          data: coConsecrators.map((personId, i) => ({
            consecrationId:  params.id,
            coConsecratorId: personId,
            ordinal:         i + 1,
          })),
        })
      }
    }

    return tx.episcopalConsecration.update({
      where: { id: params.id },
      data: {
        date:                   body.date ? new Date(body.date) : undefined,
        location:               'location' in body ? optionalString(body.location) : undefined,
        principalConsecratorId: 'principalConsecratorId' in body ? optionalString(body.principalConsecratorId) : undefined,
      },
    })
  })

  return NextResponse.json(consecration)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  await prisma.$transaction([
    prisma.episcopalConsecrationCoConsecrator.deleteMany({ where: { consecrationId: params.id } }),
    prisma.episcopalConsecration.delete({ where: { id: params.id } }),
  ])
  return NextResponse.json({ ok: true })
}
