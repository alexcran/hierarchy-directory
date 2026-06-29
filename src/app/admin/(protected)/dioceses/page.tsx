import prisma from '@/lib/prisma'
import { formatSeeName } from '@/lib/utils/formatSeeName'
import { formatName } from '@/lib/utils/formatName'
import { isCurrentCardinal } from '@/lib/utils/personStatus'
import { DioceseListClient, type DioceseRow } from './DioceseListClient'
import { type Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

const ORDINARY_ROLES = ['ordinary', 'diocesan_bishop', 'archbishop'] as const

const seeSelect = {
  id: true,
  slug: true,
  name: true,
  seeType: true,
  namePrefixOverride: true,
  coatOfArmsUrl: true,
  updatedAt: true,
  metropolitanSee: { select: { name: true, seeType: true, namePrefixOverride: true } },
  assignments: {
    where: { isCurrent: true, role: { in: [...ORDINARY_ROLES] } },
    select: {
      person: {
        select: {
          firstName: true,
          middleName: true,
          lastName: true,
          suffix: true,
          religiousOrder: true,
          cardinalate: { select: { id: true, dateEnded: true } },
        },
      },
    },
    take: 1,
  },
} satisfies Prisma.SeeSelect

type AdminSee = Prisma.SeeGetPayload<{ select: typeof seeSelect }>

export default async function AdminDiocesesPage() {
  const sees: AdminSee[] = await prisma.see.findMany({
    orderBy: { name: 'asc' },
    select: seeSelect,
  })

  const rows: DioceseRow[] = sees.map((s: AdminSee) => ({
    id:              s.id,
    slug:            s.slug,
    displayName:     formatSeeName(s.name, s.seeType, s.namePrefixOverride),
    seeType:         s.seeType,
    province:        s.metropolitanSee?.name ?? null,
    currentOrdinary: s.assignments[0]?.person ? formatName(s.assignments[0].person, { isCardinal: isCurrentCardinal(s.assignments[0].person) }) : null,
    hasCoatOfArms:   !!s.coatOfArmsUrl,
    updatedAt:       s.updatedAt.toISOString(),
  }))

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Dioceses</h1>
      </div>
      <DioceseListClient dioceses={rows} />
    </>
  )
}
