import { type Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { formatSeeName } from '@/lib/utils/formatSeeName'
import { formatName } from '@/lib/utils/formatName'
import { isCurrentCardinal, isLaicized } from '@/lib/utils/personStatus'
import { ORDINARY_ROLES, isElectRole } from '@/lib/utils/roles'

const detailInclude = {
  rite:           true,
  country:        true,
  metropolitanSee: {
    select: { id: true, slug: true, name: true, seeType: true, namePrefixOverride: true },
  },
  // Current leadership
  assignments: {
    include: {
      person: {
        select: {
          id: true,
          slug: true,
          firstName: true,
          middleName: true,
          lastName: true,
          suffix: true,
          religiousOrder: { select: { abbreviation: true } },
          portraitUrl: true,
          dateOfBirth: true,
          laicizedDate: true,
          laicizationReason: true,
          cardinalate: { select: { id: true, dateEnded: true } },
        },
      },
    },
    orderBy: { startDate: 'desc' } as Prisma.AssignmentOrderByWithRelationInput,
  },
  // Most-recent statistics for demographic display
  statistics: {
    orderBy: { year: 'desc' } as Prisma.DioceseStatisticsOrderByWithRelationInput,
    take: 1,
  },
  // Suffragan dioceses (only populated if this is a metropolitan see)
  suffraganSees: {
    orderBy: { name: 'asc' } as Prisma.SeeOrderByWithRelationInput,
    include: {
      assignments: {
        where: { isCurrent: true, role: { in: [...ORDINARY_ROLES] } } as Prisma.AssignmentWhereInput,
        include: {
          person: {
            select: {
              id: true,
              slug: true,
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true,
              religiousOrder: { select: { abbreviation: true } },
              portraitUrl: true,
              laicizedDate: true,
              laicizationReason: true,
              cardinalate: { select: { id: true, dateEnded: true } },
            },
          },
        },
        take: 1,
      },
    },
  },
} satisfies Prisma.SeeInclude

// ─── Public return type ───────────────────────────────────────────────────────

export interface PersonStub {
  id: string
  slug: string
  displayName: string
  portraitUrl: string | null
  isCardinal: boolean
  isLaicized: boolean
}

export interface LeadershipEntry extends PersonStub {
  role: string
  assignmentId: string
  startDate: Date
  endDate: Date | null
}

export interface SuccessionEntry extends PersonStub {
  assignmentId: string
  role: string
  isCurrent: boolean
  startDate: Date
  endDate: Date | null
  endReason: string | null
}

export interface SuffraganEntry {
  id: string
  slug: string
  name: string
  seeName: string
  seeType: string
  stateRegion: string | null
  currentOrdinary: PersonStub | null
}

export interface DioceseDetail {
  id: string
  slug: string
  name: string
  seeName: string
  seeType: string
  namePrefixOverride: string | null
  stateRegion: string | null
  isMetropolitan: boolean
  coatOfArmsUrl: string | null
  area: number | null
  dateErected: Date | null
  dateSuppressed: Date | null
  cathedralName: string | null
  coCathedralName: string | null
  cathedralAddress: string | null
  cathedralLatitude: unknown  // Decimal
  cathedralLongitude: unknown  // Decimal
  rite: { id: string; name: string; type: string }
  country: { id: string; name: string; isoCode: string } | null
  metropolitanSee: { id: string; slug: string; name: string; seeName: string } | null
  currentLeadership: LeadershipEntry[]
  succession: SuccessionEntry[]
  suffraganSees: SuffraganEntry[]
  catholicPopulation: number | null
  totalPopulation: number | null
  statisticsYear: number | null
}

function toPersonStub(p: {
  id: string
  slug: string
  firstName: string
  middleName: string | null
  lastName: string
  suffix: string | null
  religiousOrder: { abbreviation: string } | null
  portraitUrl: string | null
  laicizedDate?: Date | null
  laicizationReason?: string | null
  cardinalate: { id: string; dateEnded?: Date | null } | null
}, honorificLabel = 'Most Rev.'): PersonStub {
  const laicized = isLaicized(p)
  const currentCardinal = isCurrentCardinal(p)
  return {
    id:          p.id,
    slug:        p.slug,
    displayName: formatName(p, { isCardinal: currentCardinal && !laicized, honorificLabel: laicized ? null : honorificLabel }),
    portraitUrl: p.portraitUrl,
    isCardinal:  currentCardinal && !laicized,
    isLaicized:  laicized,
  }
}

export async function getDioceseBySlug(slug: string): Promise<DioceseDetail | null> {
  const see = await prisma.see.findUnique({
    where: { slug },
    include: detailInclude,
  })
  if (!see) return null

  const ROLE_ORDER: Record<string, number> = {
    ordinary: 0, diocesan_bishop: 0, archbishop: 0,
    bishop_elect: 0, archbishop_elect: 0,
    coadjutor: 1,
    apostolic_administrator: 2,
    auxiliary: 3, auxiliary_bishop_elect: 3,
  }

  const currentLeadership: LeadershipEntry[] = see.assignments
    .filter((a) => a.isCurrent)
    .map((a) => ({
      ...toPersonStub(a.person, isElectRole(a.role) ? 'Rev.' : 'Most Rev.'),
      role:         a.role,
      assignmentId: a.id,
      startDate:    a.startDate,
      endDate:      a.endDate,
    }))
    .sort((a, b) => (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99))

  const succession: SuccessionEntry[] = see.assignments.map((a) => ({
    ...toPersonStub(a.person),
    assignmentId: a.id,
    role:         a.role,
    isCurrent:    a.isCurrent,
    startDate:    a.startDate,
    endDate:      a.endDate,
    endReason:    a.endReason,
  }))

  const suffraganSees: SuffraganEntry[] = see.suffraganSees.map((s) => {
    const ordinary = s.assignments[0]?.person ?? null
    return {
      id:           s.id,
      slug:         s.slug,
      name:         s.name,
      seeName:      formatSeeName(s.name, s.seeType, s.namePrefixOverride),
      seeType:      s.seeType,
      stateRegion:  s.stateRegion,
      currentOrdinary: ordinary ? toPersonStub(ordinary) : null,
    }
  })

  const latestStats = see.statistics[0] ?? null

  return {
    id:                see.id,
    slug:              see.slug,
    name:              see.name,
    seeName:           formatSeeName(see.name, see.seeType, see.namePrefixOverride),
    seeType:           see.seeType,
    namePrefixOverride: see.namePrefixOverride,
    stateRegion:       see.stateRegion,
    isMetropolitan:    see.isMetropolitan,
    coatOfArmsUrl:     see.coatOfArmsUrl,
    area:              see.area ?? null,
    dateErected:       see.dateErected,
    dateSuppressed:    see.dateSuppressed,
    cathedralName:     see.cathedralName,
    coCathedralName:   see.coCathedralName,
    cathedralAddress:  see.cathedralAddress,
    cathedralLatitude: see.cathedralLatitude,
    cathedralLongitude: see.cathedralLongitude,
    rite:    see.rite,
    country: see.country,
    metropolitanSee: see.metropolitanSee
      ? {
          id:      see.metropolitanSee.id,
          slug:    see.metropolitanSee.slug,
          name:    see.metropolitanSee.name,
          seeName: formatSeeName(see.metropolitanSee.name, see.metropolitanSee.seeType, see.metropolitanSee.namePrefixOverride),
        }
      : null,
    currentLeadership,
    succession,
    suffraganSees,
    catholicPopulation: latestStats?.catholicPopulation ?? null,
    totalPopulation:    latestStats?.totalPopulation    ?? null,
    statisticsYear:     latestStats?.year               ?? null,
  }
}
