import prisma from '@/lib/prisma'
import { formatSeeName } from '@/lib/utils/formatSeeName'
import { formatName } from '@/lib/utils/formatName'
import { buildPersonNameSearchWhere } from '@/lib/utils/personSearch'

export interface SearchBishopResult {
  id: string
  slug: string
  name: string
  title: string | null
  portraitUrl: string | null
  isCardinal: boolean
}

export interface SearchDioceseResult {
  id: string
  slug: string
  name: string
  country: string | null
}

export interface TypeaheadResult {
  bishops: SearchBishopResult[]
  dioceses: SearchDioceseResult[]
}

export async function typeaheadSearch(query: string): Promise<TypeaheadResult> {
  const q = query.trim()
  if (q.length < 2) return { bishops: [], dioceses: [] }

  const [persons, sees] = await Promise.all([
    prisma.person.findMany({
      where: buildPersonNameSearchWhere(q),
      select: {
        id: true,
        slug: true,
        firstName: true,
        middleName: true,
        lastName: true,
        suffix: true,
        religiousOrder: { select: { abbreviation: true } },
        portraitUrl: true,
        cardinalate: { select: { id: true } },
        assignments: {
          where: { isCurrent: true },
          include: { see: { select: { name: true, seeType: true, namePrefixOverride: true } } },
          take: 1,
        },
      },
      take: 5,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
    prisma.see.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: {
        id: true,
        slug: true,
        name: true,
        seeType: true,
        namePrefixOverride: true,
        country: { select: { name: true } },
      },
      take: 5,
      orderBy: { name: 'asc' },
    }),
  ])

  const bishops: SearchBishopResult[] = persons.map((p) => {
    const asgn = p.assignments[0] ?? null
    const title = asgn
      ? formatSeeName(asgn.see.name, asgn.see.seeType, asgn.see.namePrefixOverride)
      : null
    return {
      id:          p.id,
      slug:        p.slug,
      name:        formatName(p, { isCardinal: !!p.cardinalate }),
      title,
      portraitUrl: p.portraitUrl,
      isCardinal:  !!p.cardinalate,
    }
  })

  const dioceses: SearchDioceseResult[] = sees.map((s) => ({
    id:      s.id,
    slug:    s.slug,
    name:    formatSeeName(s.name, s.seeType, s.namePrefixOverride),
    country: s.country?.name ?? null,
  }))

  return { bishops, dioceses }
}
