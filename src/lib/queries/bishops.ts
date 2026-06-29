import { type Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { formatSeeName } from '@/lib/utils/formatSeeName'
import { formatName } from '@/lib/utils/formatName'
import { computeStyleOfAddress } from '@/lib/utils/styleOfAddress'
import { isCurrentCardinal, isLaicized } from '@/lib/utils/personStatus'
import { EMERITUS_ROLES, ORDINARY_ROLES, isElectRole } from '@/lib/utils/roles'
import { buildPersonNameSearchWhere } from '@/lib/utils/personSearch'

// ─── Filter types ─────────────────────────────────────────────────────────────

export type BishopSort = 'appointment_date' | 'recently_appointed' | 'last_name' | 'see' | 'consecration_date' | 'age'

export interface BishopsFilters {
  search?: string
  /** 'active' | 'resignation_pending' | 'retired' | 'deceased' — may be multiple */
  status?: string[]
  /** 'cardinal' | 'archbishop' | 'bishop' — may be multiple */
  rank?: string[]
  /** Array of rite IDs to filter by */
  riteIds?: string[]
  countryId?: string
  state?: string
  /** ID of the metropolitan see */
  provinceId?: string
  /** ID of a specific diocese */
  dioceseId?: string
  religiousOrder?: string
  /** If true, only cardinals under 80 (papal electors) */
  isElector?: boolean
  /** Person ID of principal consecrator */
  consecratedById?: string
  consecratedAfter?: number
  consecratedBefore?: number
  /** Minimum age in whole years */
  ageMin?: number
  /** Maximum age in whole years */
  ageMax?: number
  /** Name of appointing pope (derives date range from assignment startDate) */
  appointmentPope?: string
  ordinationAfter?: number
  ordinationBefore?: number
}

// Roles that are emeritus / retired-in-place; bishops holding only these are
// not subject to the mandatory-resignation rule at age 75.
const POPE_REIGNS: Record<string, { start: Date; end: Date }> = {
  'Francis':       { start: new Date('2013-03-13'), end: new Date('9999-12-31') },
  'Benedict XVI':  { start: new Date('2005-04-19'), end: new Date('2013-02-28') },
  'John Paul II':  { start: new Date('1978-10-16'), end: new Date('2005-04-02') },
  'John Paul I':   { start: new Date('1978-08-26'), end: new Date('1978-09-28') },
  'Paul VI':       { start: new Date('1963-06-21'), end: new Date('1978-08-06') },
  'John XXIII':    { start: new Date('1958-10-28'), end: new Date('1963-06-03') },
}

// ─── WHERE builders ───────────────────────────────────────────────────────────

function buildBaseWhere(
  filters: Omit<BishopsFilters, 'status' | 'rank'>,
): Prisma.PersonWhereInput {
  const and: Prisma.PersonWhereInput[] = []

  if (filters.search) {
    and.push(buildPersonNameSearchWhere(filters.search))
  }

  if (filters.riteIds?.length) {
    and.push({ riteId: { in: filters.riteIds } })
  }

  if (filters.religiousOrder === 'diocesan') {
    and.push({ religiousOrderId: null })
  } else if (filters.religiousOrder) {
    and.push({ religiousOrderId: filters.religiousOrder })
  }

  if (filters.countryId) {
    and.push({ assignments: { some: { isCurrent: true, see: { countryId: filters.countryId } } } })
  }

  if (filters.state) {
    and.push({
      assignments: {
        some: { isCurrent: true, see: { stateRegion: { contains: filters.state, mode: 'insensitive' } } },
      },
    })
  }

  if (filters.provinceId) {
    // Bishops who serve in the province itself OR in a suffragan of it
    and.push({
      assignments: {
        some: {
          isCurrent: true,
          see: { OR: [{ id: filters.provinceId }, { metropolitanSeeId: filters.provinceId }] },
        },
      },
    })
  }

  if (filters.dioceseId) {
    and.push({ assignments: { some: { isCurrent: true, seeId: filters.dioceseId } } })
  }

  if (filters.consecratedById) {
    and.push({ consecrations: { some: { principalConsecratorId: filters.consecratedById } } })
  }

  if (filters.consecratedAfter) {
    and.push({ consecrations: { some: { date: { gte: new Date(`${filters.consecratedAfter}-01-01`) } } } })
  }

  if (filters.consecratedBefore) {
    and.push({ consecrations: { some: { date: { lte: new Date(`${filters.consecratedBefore}-12-31`) } } } })
  }

  if (filters.ageMin !== undefined) {
    const today = new Date()
    const maxBirthDate = new Date(today.getFullYear() - filters.ageMin, today.getMonth(), today.getDate())
    and.push({ dateOfBirth: { lte: maxBirthDate } })
  }

  if (filters.ageMax !== undefined) {
    const today = new Date()
    const minBirthDate = new Date(today.getFullYear() - filters.ageMax - 1, today.getMonth(), today.getDate() + 1)
    and.push({ dateOfBirth: { gte: minBirthDate } })
  }

  if (filters.isElector) {
    const today = new Date()
    const electorCutoff = new Date(today.getFullYear() - 80, today.getMonth(), today.getDate())
    and.push({ cardinalate: { is: { dateEnded: null } }, dateOfBirth: { gt: electorCutoff } })
  }

  if (filters.appointmentPope) {
    const reign = POPE_REIGNS[filters.appointmentPope]
    if (reign) {
      and.push({
        assignments: {
          some: {
            isCurrent: true,
            role: { notIn: EMERITUS_ROLES },
            startDate: { gte: reign.start, lte: reign.end },
          },
        },
      })
    }
  }

  if (filters.ordinationAfter) {
    and.push({ priesthoodOrdination: { date: { gte: new Date(`${filters.ordinationAfter}-01-01`) } } })
  }

  if (filters.ordinationBefore) {
    and.push({ priesthoodOrdination: { date: { lte: new Date(`${filters.ordinationBefore}-12-31`) } } })
  }

  return and.length > 0 ? { AND: and } : {}
}

function buildStatusWhere(status: string[]): Prisma.PersonWhereInput {
  if (!status.length) return {}
  const today = new Date()
  const age75Cutoff = new Date(today.getFullYear() - 75, today.getMonth(), today.getDate())
  const or: Prisma.PersonWhereInput[] = []

  if (status.includes('living')) {
    or.push({ dateOfDeath: null })
  }

  // Active: non-emeritus current assignment, regardless of whether resignation
  // has been submitted at 75. A bishop is active until the assignment ends.
  if (status.includes('active')) {
    or.push({
      dateOfDeath: null,
      assignments: { some: { isCurrent: true, role: { notIn: EMERITUS_ROLES } } },
    })
  }
  // Resignation pending: non-emeritus current assignment, 75 or older
  if (status.includes('resignation_pending')) {
    or.push({
      dateOfDeath: null,
      dateOfBirth: { lte: age75Cutoff },
      assignments: { some: { isCurrent: true, role: { notIn: EMERITUS_ROLES } } },
    })
  }
  // Retired: alive, no active non-emeritus assignment
  if (status.includes('retired')) {
    or.push({
      dateOfDeath: null,
      NOT: { assignments: { some: { isCurrent: true, role: { notIn: EMERITUS_ROLES } } } },
    })
  }
  if (status.includes('deceased')) or.push({ dateOfDeath: { not: null } })
  return or.length === 1 ? or[0] : { OR: or }
}

function buildRankWhere(rank: string[]): Prisma.PersonWhereInput {
  if (!rank.length) return {}
  const or: Prisma.PersonWhereInput[] = []
  if (rank.includes('cardinal')) {
    or.push({ cardinalate: { is: { dateEnded: null } } })
  }
  if (rank.includes('archbishop')) {
    or.push({ assignments: { some: { isCurrent: true, role: { in: ORDINARY_ROLES }, see: { seeType: 'archdiocese' } } } })
  }
  if (rank.includes('bishop')) {
    // "Bishop" in the filter means ordinary of a diocese (not archdiocese) or an auxiliary
    or.push({
      OR: [
        { assignments: { some: { isCurrent: true, role: { in: ORDINARY_ROLES }, see: { seeType: 'diocese' } } } },
        { assignments: { some: { isCurrent: true, role: 'auxiliary' } } },
      ],
    })
  }
  return or.length === 1 ? or[0] : { OR: or }
}

function andWhere(...parts: Prisma.PersonWhereInput[]): Prisma.PersonWhereInput {
  const nonempty = parts.filter((p) => Object.keys(p).length > 0)
  if (nonempty.length === 0) return {}
  if (nonempty.length === 1) return nonempty[0]
  return { AND: nonempty }
}

// ─── Shared include for list queries ─────────────────────────────────────────

const listInclude = {
  rite: { select: { type: true } },
  assignments: {
    where: { isCurrent: true } as Prisma.AssignmentWhereInput,
    include: {
      see: {
        select: { id: true, slug: true, name: true, seeType: true, namePrefixOverride: true },
      },
    },
    orderBy: [{ startDate: 'desc' }, { installedDate: 'desc' }] as Prisma.AssignmentOrderByWithRelationInput[],
    take: 5,
  },
  cardinalate: { select: { id: true, dateEnded: true } },
  consecrations: {
    orderBy: { date: 'asc' } as Prisma.EpiscopalConsecrationOrderByWithRelationInput,
    take: 1,
    select: { date: true },
  },
  religiousOrder: { select: { id: true, fullName: true, abbreviation: true } },
} satisfies Prisma.PersonInclude

// ─── Return types ─────────────────────────────────────────────────────────────

export interface BishopListItem {
  id: string
  slug: string
  firstName: string
  middleName: string | null
  lastName: string
  suffix: string | null
  religiousOrder: string | null
  religiousOrderId: string | null
  religiousOrderFullName: string | null
  portraitUrl: string | null
  isLaicized: boolean
  /** Full formatted display name, e.g. "Most Rev. William E. Lori" */
  displayName: string
  /** Computed style of address, e.g. "His Eminence", "His Excellency" */
  styleOfAddress: string
  currentAssignment: {
    id: string
    seeId: string
    seeSlug: string
    role: string
    /** Full formatted see name, e.g. "Archdiocese of Baltimore" */
    seeName: string
  } | null
  isCardinal: boolean
  status: 'active' | 'resignation_pending' | 'retired' | 'deceased'
  statusLabel: string
  episcopalConsecrationDate: string | null
}

export interface FilterCounts {
  status: { living: number; active: number; resignation_pending: number; retired: number; deceased: number }
  rank:   { cardinal: number; archbishop: number; bishop: number }
}

export interface BishopsResult {
  bishops: BishopListItem[]
  total: number
  page: number
  perPage: number
  filterCounts: FilterCounts
}

// ─── getBishops ───────────────────────────────────────────────────────────────

type ListRaw = Prisma.PersonGetPayload<{ include: typeof listInclude }>

function getBishopStatus(p: ListRaw): BishopListItem['status'] {
  if (p.dateOfDeath) return 'deceased'

  const hasCurrentNonEmeritus = p.assignments.some(a => a.isCurrent && !EMERITUS_ROLES.includes(a.role))
  if (!hasCurrentNonEmeritus) return 'retired'

  if (!p.dateOfBirth) return 'active'
  const today = new Date()
  const age75Cutoff = new Date(today.getFullYear() - 75, today.getMonth(), today.getDate())
  return p.dateOfBirth <= age75Cutoff ? 'resignation_pending' : 'active'
}

function statusLabel(status: BishopListItem['status']): string {
  switch (status) {
    case 'active': return 'Active'
    case 'resignation_pending': return 'Resignation pending'
    case 'retired': return 'Retired'
    case 'deceased': return 'Deceased'
  }
}

function toListItem(p: ListRaw): BishopListItem {
  const asgn = p.assignments[0] ?? null
  const cons = p.consecrations[0] ?? null
  const isCardinal = isCurrentCardinal(p)
  const laicized = isLaicized(p)
  const status = getBishopStatus(p)
  const hasEpiscopalConsecration = !!cons
  const honorificLabel = laicized ? null : isElectRole(asgn?.role) && !hasEpiscopalConsecration ? 'Rev.' : 'Most Rev.'
  return {
    id:            p.id,
    slug:          p.slug,
    firstName:     p.firstName,
    middleName:    p.middleName,
    lastName:      p.lastName,
    suffix:        p.suffix,
    religiousOrder: p.religiousOrder?.abbreviation ?? null,
    religiousOrderId: p.religiousOrder?.id ?? null,
    religiousOrderFullName: p.religiousOrder?.fullName ?? null,
    portraitUrl:   p.portraitUrl,
    isLaicized:    laicized,
    displayName:   formatName(p, { isCardinal: isCardinal && !laicized, honorificLabel }),
    styleOfAddress: computeStyleOfAddress({
      styleOfAddress: p.styleOfAddress,
      isCardinal: isCardinal && !laicized,
      currentRole: asgn?.role ?? null,
      riteType: p.rite.type,
      hasEpiscopalConsecration,
      isLaicized: laicized,
    }),
    currentAssignment: asgn
      ? {
          id:       asgn.id,
          seeId:    asgn.seeId,
          seeSlug:  asgn.see.slug,
          role:     asgn.role,
          seeName:  formatSeeName(asgn.see.name, asgn.see.seeType, asgn.see.namePrefixOverride),
        }
      : null,
    isCardinal: isCardinal && !laicized,
    status,
    statusLabel: statusLabel(status),
    episcopalConsecrationDate: cons ? cons.date.toISOString().slice(0, 10) : null,
  }
}

// Returns the startDate of the primary ordinary assignment (non-auxiliary, non-emeritus,
// non-apostolic-administrator). Falls back to the most recent current assignment if none found.
function primaryAssignmentStartTime(p: ListRaw): number {
  const primary = p.assignments.find(
    a => ORDINARY_ROLES.includes(a.role) || a.role === 'coadjutor',
  ) ?? p.assignments[0]
  return primary?.startDate?.getTime() ?? 0
}

export async function getBishops(
  filters: BishopsFilters = {},
  sort: BishopSort = 'appointment_date',
  page = 1,
  perPage = 48,
  dir: 'asc' | 'desc' = 'desc',
): Promise<BishopsResult> {
  const { status = [], rank = [], ...rest } = filters
  const search = rest.search?.trim()

  const baseWhere   = buildBaseWhere(search ? { search } : rest)
  const statusWhere = search ? {} : buildStatusWhere(status)
  const rankWhere   = search ? {} : buildRankWhere(rank)
  const fullWhere   = andWhere(baseWhere, statusWhere, rankWhere)

  // For filter counts, exclude the filter category being counted
  const forStatusCounts = andWhere(baseWhere, rankWhere)
  const forRankCounts   = andWhere(baseWhere, statusWhere)

  let orderBy: Prisma.PersonOrderByWithRelationInput | Prisma.PersonOrderByWithRelationInput[]

  const isInMemorySort = sort === 'appointment_date' || sort === 'recently_appointed'

  switch (sort) {
    case 'age':
      orderBy = { dateOfBirth: dir === 'asc' ? 'asc' : 'desc' }
      break
    case 'appointment_date':
    case 'recently_appointed':
      // Sorted in-memory after fetch to support primary-assignment logic
      orderBy = [{ lastName: 'asc' }, { firstName: 'asc' }]
      break
    case 'last_name':
      orderBy = [
        { lastName: dir === 'asc' ? 'asc' : 'desc' },
        { firstName: dir === 'asc' ? 'asc' : 'desc' },
      ]
      break
    case 'consecration_date':
    // Ordering by consecration date or see name requires raw SQL for a to-many relation;
    // fall through to last_name until that is implemented.
    case 'see':
    default:
      orderBy = [{ lastName: 'asc' }, { firstName: 'asc' }]
  }

  const [bishops, total, filterCounts] = await Promise.all([
    prisma.person.findMany({
      where: fullWhere,
      include: listInclude,
      orderBy,
      ...(isInMemorySort
        ? {}
        : { skip: (page - 1) * perPage, take: perPage }),
    }),
    prisma.person.count({ where: fullWhere }),
    getFilterCounts(forStatusCounts, forRankCounts),
  ])

  const pageBishops = isInMemorySort
    ? bishops
        .sort((a, b) => {
          const ta = primaryAssignmentStartTime(a)
          const tb = primaryAssignmentStartTime(b)
          const timeDiff = dir === 'desc' ? tb - ta : ta - tb
          if (timeDiff !== 0) return timeDiff
          return a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
        })
        .slice((page - 1) * perPage, page * perPage)
    : bishops

  return {
    bishops:      pageBishops.map(toListItem),
    total,
    page,
    perPage,
    filterCounts,
  }
}

async function getFilterCounts(
  forStatus: Prisma.PersonWhereInput,
  forRank:   Prisma.PersonWhereInput,
): Promise<FilterCounts> {
  const today = new Date()
  const age75Cutoff = new Date(today.getFullYear() - 75, today.getMonth(), today.getDate())

  const [living, active, resignationPending, retired, deceased, cardinal, archbishop, bishop] = await Promise.all([
    prisma.person.count({ where: andWhere(forStatus, { dateOfDeath: null }) }),
    prisma.person.count({
      where: andWhere(forStatus, {
        dateOfDeath: null,
        assignments: { some: { isCurrent: true, role: { notIn: EMERITUS_ROLES } } },
      }),
    }),
    prisma.person.count({
      where: andWhere(forStatus, {
        dateOfDeath: null,
        dateOfBirth: { lte: age75Cutoff },
        assignments: { some: { isCurrent: true, role: { notIn: EMERITUS_ROLES } } },
      }),
    }),
    prisma.person.count({
      where: andWhere(forStatus, {
        dateOfDeath: null,
        NOT: { assignments: { some: { isCurrent: true, role: { notIn: EMERITUS_ROLES } } } },
      }),
    }),
    prisma.person.count({ where: andWhere(forStatus, { dateOfDeath: { not: null } }) }),
    prisma.person.count({ where: andWhere(forRank, { cardinalate: { is: { dateEnded: null } } }) }),
    prisma.person.count({
      where: andWhere(forRank, {
        assignments: { some: { isCurrent: true, role: { in: ORDINARY_ROLES }, see: { seeType: 'archdiocese' } } },
      }),
    }),
    prisma.person.count({
      where: andWhere(forRank, {
        OR: [
          { assignments: { some: { isCurrent: true, role: { in: ORDINARY_ROLES }, see: { seeType: 'diocese' } } } },
          { assignments: { some: { isCurrent: true, role: 'auxiliary' } } },
        ],
      }),
    }),
  ])

  return {
    status: { living, active, resignation_pending: resignationPending, retired, deceased },
    rank:   { cardinal, archbishop, bishop },
  }
}

// ─── getBishopById ────────────────────────────────────────────────────────────

const detailInclude = {
  rite: true,
  countryOfBirth: true,
  cardinalate: true,
  religiousOrder: { select: { id: true, fullName: true, abbreviation: true } },
  priesthoodOrdination: {
    include: {
      ordainingBishop: {
        select: { id: true, slug: true, firstName: true, middleName: true, lastName: true, suffix: true, religiousOrder: { select: { abbreviation: true } }, portraitUrl: true, cardinalate: { select: { id: true, dateEnded: true } } },
      },
      incardinationSee: {
        select: { id: true, slug: true, name: true, seeType: true, namePrefixOverride: true },
      },
      ordinationSee: {
        select: { id: true, slug: true, name: true, seeType: true, namePrefixOverride: true },
      },
    },
  },
  consecrations: {
    include: {
      principalConsecrator: {
        select: { id: true, slug: true, firstName: true, middleName: true, lastName: true, suffix: true, religiousOrder: { select: { abbreviation: true } }, portraitUrl: true, cardinalate: { select: { id: true, dateEnded: true } } },
      },
      coConsecrators: {
        orderBy: { ordinal: 'asc' } as Prisma.EpiscopalConsecrationCoConsecratorOrderByWithRelationInput,
        include: {
          coConsecrator: {
            select: { id: true, slug: true, firstName: true, middleName: true, lastName: true, suffix: true, religiousOrder: { select: { abbreviation: true } }, portraitUrl: true, cardinalate: { select: { id: true, dateEnded: true } } },
          },
        },
      },
    },
  },
  assignments: {
    include: {
      see: {
        select: { id: true, slug: true, name: true, seeType: true, namePrefixOverride: true, stateRegion: true, country: { select: { name: true } } },
      },
    },
    orderBy: [{ startDate: 'desc' }, { installedDate: 'desc' }] as Prisma.AssignmentOrderByWithRelationInput[],
  },
  consecrationsAsConsecrator: {
    orderBy: { date: 'asc' } as Prisma.EpiscopalConsecrationOrderByWithRelationInput,
    include: {
      person: {
        select: {
          id: true,
          slug: true,
          firstName: true,
          middleName: true,
          lastName: true,
          suffix: true,
          dateOfBirth: true,
          dateOfDeath: true,
          laicizedDate: true,
          laicizationReason: true,
          religiousOrder: { select: { abbreviation: true } },
          portraitUrl: true,
          styleOfAddress: true,
          cardinalate: { select: { id: true, dateEnded: true } },
          rite: { select: { type: true } },
          assignments: {
            where: { isCurrent: true } as Prisma.AssignmentWhereInput,
            include: { see: { select: { id: true, slug: true, name: true, seeType: true, namePrefixOverride: true } } },
            take: 1,
          },
        },
      },
    },
  },
} satisfies Prisma.PersonInclude

export type BishopDetail = Prisma.PersonGetPayload<{ include: typeof detailInclude }> & {
  displayName: string
}

export async function getBishopBySlug(slug: string): Promise<BishopDetail | null> {
  const person = await prisma.person.findUnique({
    where: { slug },
    include: detailInclude,
  })
  if (!person) return null
  const currentAssignment = person.assignments.find(a => a.isCurrent && a.role !== 'apostolic_administrator') ?? null
  const laicized = isLaicized(person)
  const honorificLabel = laicized ? null : isElectRole(currentAssignment?.role) && person.consecrations.length === 0 ? 'Rev.' : 'Most Rev.'
  return { ...person, displayName: formatName(person, { isCardinal: isCurrentCardinal(person) && !laicized, honorificLabel }) }
}

// ─── getBishopLineage ─────────────────────────────────────────────────────────

export interface LineagePerson {
  id: string
  slug: string
  displayName: string
  portraitUrl: string | null
  isCardinal: boolean
  currentTitle: string | null
}

export async function getBishopLineage(
  personId: string,
  maxDepth = 12,
): Promise<LineagePerson[]> {
  const chain: LineagePerson[] = []
  const visited = new Set<string>([personId])
  let currentId = personId

  for (let i = 0; i < maxDepth; i++) {
    const record = await prisma.episcopalConsecration.findFirst({
      where: { personId: currentId },
      select: {
        principalConsecrator: {
          select: {
            id: true,
            slug: true,
            firstName: true,
            middleName: true,
            lastName: true,
            suffix: true,
            religiousOrder: { select: { abbreviation: true } },
            portraitUrl: true,
            cardinalate: { select: { id: true, dateEnded: true } },
            assignments: {
              where: { isCurrent: true } as Prisma.AssignmentWhereInput,
              include: { see: { select: { id: true, slug: true, name: true, seeType: true, namePrefixOverride: true } } },
              take: 1,
            },
          },
        },
      },
    })
    const p = record?.principalConsecrator
    if (!p || visited.has(p.id)) break
    visited.add(p.id)
    const asgn = p.assignments[0] ?? null
    chain.push({
      id: p.id,
      slug: p.slug,
      displayName: formatName(p, { isCardinal: isCurrentCardinal(p) }),
      portraitUrl: p.portraitUrl,
      isCardinal: isCurrentCardinal(p),
      currentTitle: asgn
        ? formatSeeName(asgn.see.name, asgn.see.seeType, asgn.see.namePrefixOverride)
        : null,
    })
    currentId = p.id
  }

  return chain
}
