import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { error } = await adminAuthCheck()
  if (error) return error

  const body = await req.json()

  const stat = await prisma.dioceseStatistics.create({
    data: {
      seeId:              body.seeId,
      year:               Number(body.year),
      catholicPopulation: body.catholicPopulation != null ? Number(body.catholicPopulation) : null,
      totalPopulation:    body.totalPopulation    != null ? Number(body.totalPopulation)    : null,
      numParishes:        body.numParishes        != null ? Number(body.numParishes)        : null,
      numPriests:         body.numPriests         != null ? Number(body.numPriests)         : null,
      numDeacons:         body.numDeacons         != null ? Number(body.numDeacons)         : null,
      numReligious:       body.numReligious       != null ? Number(body.numReligious)       : null,
      source:             body.source || null,
    },
  })

  return NextResponse.json(stat)
}
