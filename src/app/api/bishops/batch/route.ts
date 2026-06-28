import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { formatName } from '@/lib/utils/formatName'
import { formatSeeName } from '@/lib/utils/formatSeeName'
import { formatRoleTitle } from '@/lib/utils/formatTitle'
import { computeStyleOfAddress } from '@/lib/utils/styleOfAddress'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const idsParam = searchParams.get('ids') ?? ''
  const ids = idsParam.split(',').filter(Boolean).slice(0, 200)

  if (ids.length === 0) return NextResponse.json([])

  const persons = await prisma.person.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      slug: true,
      firstName: true,
      middleName: true,
      lastName: true,
      suffix: true,
      religiousOrder: { select: { abbreviation: true } },
      portraitUrl: true,
      styleOfAddress: true,
      dateOfBirth: true,
      placeOfBirth: true,
      dateOfDeath: true,
      cardinalate: { select: { id: true } },
      rite: { select: { name: true, type: true } },
      assignments: {
        where: { isCurrent: true },
        orderBy: { startDate: 'desc' },
        take: 1,
        include: {
          see: {
            select: { id: true, slug: true, name: true, seeType: true, namePrefixOverride: true },
          },
        },
      },
      priesthoodOrdination: {
        select: { date: true, location: true },
      },
      consecrations: {
        orderBy: { date: 'asc' },
        take: 1,
        select: {
          date: true,
          location: true,
          principalConsecrator: {
            select: { firstName: true, middleName: true, lastName: true, suffix: true, religiousOrder: { select: { abbreviation: true } }, cardinalate: { select: { id: true } } },
          },
        },
      },
      education: {
        orderBy: { ordinal: 'asc' },
        take: 3,
        select: { institution: true },
      },
    },
  })

  const results = persons.map((p) => {
    const asgn = p.assignments[0] ?? null
    const seeName = asgn
      ? formatSeeName(asgn.see.name, asgn.see.seeType, asgn.see.namePrefixOverride)
      : null
    const con = p.consecrations[0] ?? null
    const ord = p.priesthoodOrdination

    return {
      id:                   p.id,
      slug:                 p.slug,
      displayName:          formatName(p, { isCardinal: !!p.cardinalate }),
      firstName:            p.firstName,
      lastName:             p.lastName,
      portraitUrl:          p.portraitUrl,
      isCardinal:           !!p.cardinalate,
      // Current Role
      currentRole:          asgn?.role ?? null,
      currentTitle:         asgn ? formatRoleTitle(asgn.role, asgn.role.endsWith('_emeritus') ? '' : seeName ?? '') : null,
      currentSee:           seeName,
      currentSeeSlug:       asgn?.see.slug ?? null,
      styleOfAddress:       computeStyleOfAddress({ styleOfAddress: p.styleOfAddress, isCardinal: !!p.cardinalate, currentRole: asgn?.role ?? null, riteType: p.rite.type, hasEpiscopalConsecration: !!con }),
      // Biographical
      dateOfBirth:          p.dateOfBirth?.toISOString() ?? null,
      placeOfBirth:         p.placeOfBirth,
      dateOfDeath:          p.dateOfDeath?.toISOString() ?? null,
      // Ordination
      priestOrdDate:        ord?.date?.toISOString() ?? null,
      priestOrdLocation:    ord?.location ?? null,
      episcopalConsDate:    con?.date?.toISOString() ?? null,
      episcopalConsLocation: con?.location ?? null,
      principalConsecrator: con?.principalConsecrator ? formatName(con.principalConsecrator, { honorific: false, isCardinal: !!con.principalConsecrator.cardinalate }) : null,
      // Other
      religiousOrder:       p.religiousOrder?.abbreviation ?? null,
      rite:                 p.rite.name,
      education:            p.education.length > 0 ? p.education.map(e => e.institution).join('; ') : null,
    }
  })

  // Preserve the caller's requested order
  const orderMap = new Map(ids.map((id, i) => [id, i]))
  results.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))

  return NextResponse.json(results)
}
