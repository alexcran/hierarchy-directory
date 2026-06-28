import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'

function optInt(body: Record<string, unknown>, field: string): number | null | undefined {
  if (!(field in body)) return undefined
  const v = body[field]
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  const body = await req.json()

  const stat = await prisma.dioceseStatistics.update({
    where: { id: params.id },
    data: {
      year:               body.year               !== undefined ? Number(body.year)               : undefined,
      catholicPopulation: optInt(body, 'catholicPopulation'),
      totalPopulation:    optInt(body, 'totalPopulation'),
      numParishes:        optInt(body, 'numParishes'),
      numPriests:         optInt(body, 'numPriests'),
      numDeacons:         optInt(body, 'numDeacons'),
      numReligious:       optInt(body, 'numReligious'),
      source:             body.source              !== undefined ? (body.source || null) : undefined,
    },
  })

  return NextResponse.json(stat)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await adminAuthCheck()
  if (error) return error

  await prisma.dioceseStatistics.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
