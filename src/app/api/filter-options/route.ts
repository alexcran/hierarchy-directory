import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [rawRites, dioceses, provinces] = await Promise.all([
    prisma.rite.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, type: true },
    }),
    prisma.see.findMany({
      where: { dateSuppressed: null },
      orderBy: [{ stateRegion: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, seeType: true, namePrefixOverride: true, stateRegion: true },
    }),
    prisma.see.findMany({
      where: { isMetropolitan: true, dateSuppressed: null, rite: { name: 'Latin' } },
      orderBy: [{ stateRegion: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, seeType: true, namePrefixOverride: true, stateRegion: true },
    }),
  ])
  const rites = rawRites.map(rite => ({ ...rite, type: rite.type.toLowerCase() }))

  return NextResponse.json({ rites, dioceses, provinces })
}
