import type { Metadata } from 'next'
import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import { formatSeeName } from '@/lib/utils/formatSeeName'
import { formatName } from '@/lib/utils/formatName'
import { formatProvinceName } from '@/lib/utils/formatProvinceName'
import { formatRoleTitle } from '@/lib/utils/formatTitle'
import { ORDINARY_ROLES } from '@/lib/utils/roles'
import { DiocesesClient, type DioceseEntry } from './DiocesesClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Catholic Dioceses of the United States',
  description: 'Browse the dioceses and archdioceses of the United States Catholic Church, organized by province, state, and rite. Includes Eastern Catholic eparchies and apostolic exarchates.',
  alternates: { canonical: 'https://hierarchy.directory/dioceses' },
  openGraph: {
    title: 'Catholic Dioceses of the United States | Hierarchy.Directory',
    description: 'Browse the dioceses and archdioceses of the United States Catholic Church, organized by province, state, and rite.',
    url: 'https://hierarchy.directory/dioceses',
  },
}

export default async function DiocesesPage() {
  const sees = await prisma.see.findMany({
    where: { dateSuppressed: null },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      seeType: true,
      namePrefixOverride: true,
      stateRegion: true,
      seeCity: true,
      isMetropolitan: true,
      metropolitanSeeId: true,
      dateErected: true,
      area: true,
      rite: { select: { name: true, type: true } },
      metropolitanSee: { select: { name: true } },
      statistics: {
        orderBy: { year: 'desc' },
        take: 1,
        select: { catholicPopulation: true, totalPopulation: true },
      },
      assignments: {
        where: { isCurrent: true, role: { in: [...ORDINARY_ROLES, 'apostolic_administrator'] } },
        select: {
          role: true,
          person: {
            select: {
              slug: true,
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true,
              religiousOrder: { select: { abbreviation: true } },
              portraitUrl: true,
              cardinalate: { select: { id: true } },
            },
          },
        },
      },
    },
  })

  const entries: DioceseEntry[] = sees.map(s => {
    const isEastern = s.rite.type.toLowerCase() === 'eastern'
    const provincePlaceName = s.isMetropolitan ? s.name : (s.metropolitanSee?.name ?? s.name)
    const seeName = formatSeeName(s.name, s.seeType, s.namePrefixOverride)

    const ordinaryAssignment = s.assignments.find(a => ORDINARY_ROLES.includes(a.role as typeof ORDINARY_ROLES[number]))
    const adminAssignment = s.assignments.find(a => a.role === 'apostolic_administrator')

    const latestStats = s.statistics[0] ?? null

    return {
      id:                            s.id,
      slug:                          s.slug,
      seeName,
      seeType:                       s.seeType,
      isMetropolitan:                s.isMetropolitan,
      stateRegion:                   s.stateRegion,
      seeCity:                       s.seeCity,
      provinceName:                  isEastern ? s.rite.name : formatProvinceName(provincePlaceName),
      dateErected:                   s.dateErected ? s.dateErected.toISOString().split('T')[0] : null,
      riteName:                      s.rite.name,
      riteType:                      s.rite.type.toLowerCase(),
      isImmediatelySubjectToHolySee: !s.isMetropolitan && !s.metropolitanSeeId,
      catholicPopulation:            latestStats?.catholicPopulation ?? null,
      totalPopulation:               latestStats?.totalPopulation    ?? null,
      area:                          s.area ?? null,
      bishop: ordinaryAssignment?.person
        ? {
            slug:        ordinaryAssignment.person.slug,
            displayName: formatName(ordinaryAssignment.person, { isCardinal: !!ordinaryAssignment.person.cardinalate }),
            title:       formatRoleTitle(ordinaryAssignment.role, seeName),
            portraitUrl: ordinaryAssignment.person.portraitUrl,
          }
        : null,
      apostolicAdmin: adminAssignment?.person
        ? {
            slug:        adminAssignment.person.slug,
            displayName: formatName(adminAssignment.person, { isCardinal: !!adminAssignment.person.cardinalate }),
            portraitUrl: adminAssignment.person.portraitUrl,
          }
        : null,
    }
  })

  const hasCatholicPop = entries.some(e => e.catholicPopulation != null)
  const hasTotalPop    = entries.some(e => e.totalPopulation    != null)
  const hasArea        = entries.some(e => e.area               != null)

  return (
    <Suspense>
      <DiocesesClient
        dioceses={entries}
        hasCatholicPop={hasCatholicPop}
        hasTotalPop={hasTotalPop}
        hasArea={hasArea}
      />
    </Suspense>
  )
}
