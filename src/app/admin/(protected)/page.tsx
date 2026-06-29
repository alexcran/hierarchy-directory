import prisma from '@/lib/prisma'
import Link from 'next/link'
import { formatName } from '@/lib/utils/formatName'
import { isCurrentCardinal } from '@/lib/utils/personStatus'
import { type Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

type Rank = 'Cardinal' | 'Archbishop' | 'Bishop'

function getRank(
  cardinalate: { id: string; dateEnded: Date | null } | null,
  assignments: Array<{ role: string; see: { seeType: string } }>,
): Rank {
  if (cardinalate && !cardinalate.dateEnded) return 'Cardinal'
  const a = assignments[0]
  if (a && a.see.seeType === 'archdiocese' && a.role !== 'auxiliary') return 'Archbishop'
  return 'Bishop'
}


const RANK_STYLE: Record<Rank, string> = {
  Cardinal:   'bg-red-50 text-red-700',
  Archbishop: 'bg-green-50 text-green-700',
  Bishop:     'bg-green-50 text-green-700',
}

const recentPersonSelect = {
  id: true,
  firstName: true,
  middleName: true,
  lastName: true,
  suffix: true,
  religiousOrder: true,
  updatedAt: true,
  cardinalate: { select: { id: true, dateEnded: true } },
  assignments: {
    where: { isCurrent: true },
    select: { role: true, see: { select: { seeType: true } } },
    take: 1,
    orderBy: { startDate: 'desc' },
  },
} satisfies Prisma.PersonSelect

const recentSeeSelect = {
  id: true,
  name: true,
  seeType: true,
  updatedAt: true,
} satisfies Prisma.SeeSelect

type RecentPerson = Prisma.PersonGetPayload<{ select: typeof recentPersonSelect }>
type RecentSee = Prisma.SeeGetPayload<{ select: typeof recentSeeSelect }>

export default async function AdminDashboardPage() {
  type AutoActivityRow = {
    id: string
    label: string
    href: string
    badge: string
    badge_style: string
    created_at: Date
  }

  const autoActivityPromise = prisma.$queryRaw<AutoActivityRow[]>`
    SELECT id, label, href, badge, badge_style, created_at
    FROM admin_activity
    ORDER BY created_at DESC
    LIMIT 20
  `.catch(() => [] as AutoActivityRow[])

  const [totalBishops, totalDioceses, portraitsUploaded, recentPersons, recentSees, autoActivity]: [
    number,
    number,
    number,
    RecentPerson[],
    RecentSee[],
    AutoActivityRow[],
  ] = await Promise.all([
    prisma.person.count(),
    prisma.see.count(),
    prisma.person.count({ where: { portraitUrl: { not: null } } }),
    prisma.person.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: recentPersonSelect,
    }),
    prisma.see.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: recentSeeSelect,
    }),
    autoActivityPromise,
  ])

  const missingPortraits = totalBishops - portraitsUploaded

  type ActivityItem = {
    key: string
    label: string
    href: string
    badge: string
    badgeStyle: string
    updatedAt: Date
  }

  const activity: ActivityItem[] = [
    ...recentPersons.map((p: RecentPerson) => {
      const rank = getRank(p.cardinalate, p.assignments)
      return {
        key: `p-${p.id}`,
        label: formatName(p, { honorific: false, isCardinal: isCurrentCardinal(p) }),
        href: `/admin/bishops/${p.id}`,
        badge: rank,
        badgeStyle: RANK_STYLE[rank],
        updatedAt: p.updatedAt,
      }
    }),
    ...recentSees.map((s: RecentSee) => ({
      key: `s-${s.id}`,
      label: s.name,
      href: `/admin/dioceses/${s.id}`,
      badge: 'Diocese',
      badgeStyle: 'bg-blue-50 text-blue-700',
      updatedAt: s.updatedAt,
    })),
    ...autoActivity.map((a: AutoActivityRow) => ({
      key: `auto-${a.id}`,
      label: a.label,
      href: a.href,
      badge: a.badge,
      badgeStyle: a.badge_style,
      updatedAt: a.created_at,
    })),
  ]
    .sort((a: ActivityItem, b: ActivityItem) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 20)

  const stats = [
    { label: 'Total Bishops',      value: totalBishops },
    { label: 'Total Dioceses',     value: totalDioceses },
    { label: 'Portraits Uploaded', value: portraitsUploaded },
    { label: 'Missing Portraits',  value: missingPortraits, highlight: missingPortraits > 0 },
  ]

  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-text-primary mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-border rounded-xl px-5 py-5">
            <p className="font-body text-xs text-text-tertiary uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`font-display text-3xl font-semibold ${s.highlight ? 'text-amber-600' : 'text-text-primary'}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-body text-sm font-semibold text-text-primary">Recent Activity</h2>
        </div>
        <ul className="divide-y divide-border">
          {activity.map(item => (
            <li key={item.key} className="flex items-center justify-between px-6 py-3 hover:bg-surface transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`inline-block text-xs font-body font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ${item.badgeStyle}`}>
                  {item.badge}
                </span>
                <Link href={item.href} className="font-body text-sm text-text-primary hover:underline truncate">
                  {item.label}
                </Link>
              </div>
              <time className="font-body text-xs text-text-tertiary flex-shrink-0 ml-4">
                {item.updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </time>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
