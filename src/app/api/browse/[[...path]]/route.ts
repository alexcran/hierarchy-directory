import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { formatSeeName } from '@/lib/utils/formatSeeName'
import { formatName } from '@/lib/utils/formatName'
import { slugify, unslugify } from '@/lib/utils/slugify'
import { isCurrentCardinal } from '@/lib/utils/personStatus'
import { ORDINARY_ROLES } from '@/lib/utils/roles'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { path?: string[] } },
) {
  try {
    const path = params.path ?? []

    // ── Level 0: list all rites ─────────────────────────────────────────────
    if (path.length === 0) {
      const rites = await prisma.rite.findMany({ orderBy: { name: 'asc' } })
      return NextResponse.json({
        level: 'rites',
        items: rites.map((r) => ({ ...r, slug: slugify(r.name) })),
      })
    }

    // ── Level 1: countries for a rite ───────────────────────────────────────
    if (path.length === 1) {
      const riteSlug = path[0]
      const rite = await prisma.rite.findFirst({
        where: { name: { equals: unslugify(riteSlug), mode: 'insensitive' } },
      })
      if (!rite) return NextResponse.json({ error: 'Rite not found' }, { status: 404 })

      const countries = await prisma.country.findMany({
        where: { sees: { some: { riteId: rite.id } } },
        orderBy: { name: 'asc' },
      })
      return NextResponse.json({
        level:   'countries',
        rite:    { ...rite, slug: riteSlug },
        items:   countries.map((c) => ({ ...c, slug: slugify(c.name) })),
      })
    }

    // ── Level 2: provinces (metropolitan sees) for a country ────────────────
    if (path.length === 2) {
      const [riteSlug, countrySlug] = path

      const rite = await prisma.rite.findFirst({
        where: { name: { equals: unslugify(riteSlug), mode: 'insensitive' } },
      })
      if (!rite) return NextResponse.json({ error: 'Rite not found' }, { status: 404 })

      const country = await prisma.country.findFirst({
        where: { name: { equals: unslugify(countrySlug), mode: 'insensitive' } },
      })
      if (!country) return NextResponse.json({ error: 'Country not found' }, { status: 404 })

      const metropolitans = await prisma.see.findMany({
        where: { riteId: rite.id, countryId: country.id, isMetropolitan: true },
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { suffraganSees: true } },
          assignments: {
            where: { isCurrent: true, role: { in: [...ORDINARY_ROLES] } },
            include: {
              person: {
                select: {
                  id: true, slug: true, firstName: true, middleName: true, lastName: true,
                  suffix: true, religiousOrder: { select: { abbreviation: true } }, portraitUrl: true,
                  cardinalate: { select: { id: true, dateEnded: true } },
                },
              },
            },
            take: 1,
          },
        },
      })

      return NextResponse.json({
        level:   'provinces',
        rite:    { ...rite, slug: riteSlug },
        country: { ...country, slug: countrySlug },
        items:   metropolitans.map((s) => {
          const ord = s.assignments[0]?.person ?? null
          return {
            id:            s.id,
            name:          s.name,
            seeName:       formatSeeName(s.name, s.seeType, s.namePrefixOverride),
            slug:          `province-of-${slugify(s.name)}`,
            seeSlug:       s.slug,
            suffraganCount: s._count.suffraganSees,
            currentArchbishop: ord
              ? { id: ord.id, slug: ord.slug, displayName: formatName(ord, { isCardinal: isCurrentCardinal(ord) }), portraitUrl: ord.portraitUrl }
              : null,
          }
        }),
      })
    }

    // ── Level 3: dioceses in a province ─────────────────────────────────────
    if (path.length === 3) {
      const [riteSlug, countrySlug, provinceSlug] = path

      const rite = await prisma.rite.findFirst({
        where: { name: { equals: unslugify(riteSlug), mode: 'insensitive' } },
      })
      if (!rite) return NextResponse.json({ error: 'Rite not found' }, { status: 404 })

      const country = await prisma.country.findFirst({
        where: { name: { equals: unslugify(countrySlug), mode: 'insensitive' } },
      })
      if (!country) return NextResponse.json({ error: 'Country not found' }, { status: 404 })

      // Strip "province-of-" prefix and unslugify to get the metropolitan see name
      const metropolitanName = unslugify(provinceSlug.replace(/^province-of-/, ''))

      const metropolitanSee = await prisma.see.findFirst({
        where: {
          name:      { equals: metropolitanName, mode: 'insensitive' },
          riteId:    rite.id,
          countryId: country.id,
          isMetropolitan: true,
        },
      })
      if (!metropolitanSee) return NextResponse.json({ error: 'Province not found' }, { status: 404 })

      const sees = await prisma.see.findMany({
        where: {
          OR: [
            { id: metropolitanSee.id },
            { metropolitanSeeId: metropolitanSee.id },
          ],
        },
        orderBy: { name: 'asc' },
        include: {
          assignments: {
            where: { isCurrent: true },
            include: {
              person: {
                select: {
                  id: true, slug: true, firstName: true, middleName: true, lastName: true,
                  suffix: true, religiousOrder: { select: { abbreviation: true } }, portraitUrl: true,
                  cardinalate: { select: { id: true, dateEnded: true } },
                },
              },
            },
          },
        },
      })

      return NextResponse.json({
        level:   'dioceses',
        rite:    { ...rite, slug: riteSlug },
        country: { ...country, slug: countrySlug },
        province: {
          id:      metropolitanSee.id,
          name:    metropolitanSee.name,
          seeName: formatSeeName(metropolitanSee.name, metropolitanSee.seeType, metropolitanSee.namePrefixOverride),
          slug:    provinceSlug,
        },
        items: sees.map((s) => {
          const ordinary  = s.assignments.find((a) => ORDINARY_ROLES.includes(a.role as typeof ORDINARY_ROLES[number]) && a.isCurrent)
          const auxiliary = s.assignments.filter((a) => a.role === 'auxiliary' && a.isCurrent)
          return {
            id:      s.id,
            slug:    s.slug,
            name:    s.name,
            seeName: formatSeeName(s.name, s.seeType, s.namePrefixOverride),
            seeType: s.seeType,
            isMetropolitan: s.isMetropolitan,
            currentOrdinary: ordinary
              ? {
                  id:          ordinary.person.id,
                  slug:        ordinary.person.slug,
                  displayName: formatName(ordinary.person, { isCardinal: isCurrentCardinal(ordinary.person) }),
                  portraitUrl: ordinary.person.portraitUrl,
                  isCardinal:  isCurrentCardinal(ordinary.person),
                }
              : null,
            auxiliaryCount: auxiliary.length,
          }
        }),
      })
    }

    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  } catch (err) {
    console.error('[GET /api/browse]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
