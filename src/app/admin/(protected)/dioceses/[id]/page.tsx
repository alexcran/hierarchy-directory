import { notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatSeeName } from '@/lib/utils/formatSeeName'
import { formatName } from '@/lib/utils/formatName'
import { DioceseEditForm } from './DioceseEditForm'
import { CoatOfArmsUploader } from './CoatOfArmsUploader'
import { DioceseStatisticsEditor, type StatRecord } from './DioceseStatisticsEditor'
import { BreadcrumbSetter } from '@/components/admin/BreadcrumbSetter'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null): string {
  return d ? d.toISOString().split('T')[0] : ''
}

function roleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')
}

async function getSee(id: string) {
  return prisma.see.findUnique({
    where: { id },
    include: {
      metropolitanSee: { select: { id: true, name: true, seeType: true, namePrefixOverride: true } },
      country: { select: { id: true, name: true, isoCode: true } },
      rite:    { select: { id: true, name: true, type: true } },
      assignments: {
        orderBy: { startDate: 'desc' },
        include: {
          person: {
            select: { id: true, firstName: true, middleName: true, lastName: true, suffix: true, slug: true },
          },
        },
      },
      statistics: {
        orderBy: { year: 'desc' },
      },
    },
  })
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const see = await prisma.see.findUnique({
    where: { id: params.id },
    select: { name: true, seeType: true, namePrefixOverride: true },
  })
  if (!see) return { title: 'Diocese' }
  return { title: `${formatSeeName(see.name, see.seeType, see.namePrefixOverride)} — Admin` }
}

export default async function DioceseEditPage({ params }: { params: { id: string } }) {
  const [see, countries, rites] = await Promise.all([
    getSee(params.id),
    prisma.country.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, isoCode: true } }),
    prisma.rite.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, type: true } }),
  ])

  if (!see) notFound()

  const displayName = formatSeeName(see.name, see.seeType, see.namePrefixOverride)

  const formInitial = {
    name:                see.name,
    latinName:           see.latinName ?? '',
    seeType:             see.seeType,
    namePrefixOverride:  see.namePrefixOverride ?? '',
    stateRegion:         see.stateRegion ?? '',
    isMetropolitan:      see.isMetropolitan,
    metropolitanSeeId:   see.metropolitanSeeId,
    metropolitanSeeName: see.metropolitanSee
      ? formatSeeName(see.metropolitanSee.name, see.metropolitanSee.seeType, see.metropolitanSee.namePrefixOverride)
      : null,
    countryId:        see.countryId,
    riteId:           see.riteId,
    dateErected:      fmtDate(see.dateErected),
    dateSuppressed:   fmtDate(see.dateSuppressed),
    cathedralName:    see.cathedralName    ?? '',
    coCathedralName:  see.coCathedralName  ?? '',
    cathedralAddress: see.cathedralAddress ?? '',
  }

  const statisticsRecords: StatRecord[] = see.statistics.map(s => ({
    id:                 s.id,
    year:               s.year,
    catholicPopulation: s.catholicPopulation,
    totalPopulation:    s.totalPopulation,
    numParishes:        s.numParishes,
    numPriests:         s.numPriests,
    numDeacons:         s.numDeacons,
    numReligious:       s.numReligious,
    source:             s.source,
  }))

  return (
    <>
      <BreadcrumbSetter label={displayName} />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/dioceses" className="text-sm font-body text-text-tertiary hover:text-text-primary transition-colors">
            ← Dioceses
          </Link>
          <span className="text-text-tertiary">/</span>
          <h1 className="font-display text-2xl font-semibold text-text-primary truncate">{displayName}</h1>
        </div>
        <Link
          href={`/dioceses/${see.slug}`}
          target="_blank"
          className="flex-shrink-0 text-sm font-body text-text-secondary hover:text-text-primary transition-colors"
        >
          View on site ↗
        </Link>
      </div>

      <div className="space-y-6">
        <DioceseEditForm seeId={see.id} initial={formInitial} countries={countries} rites={rites} />
        <CoatOfArmsUploader seeId={see.id} currentUrl={see.coatOfArmsUrl} />
        <DioceseStatisticsEditor seeId={see.id} initial={statisticsRecords} />

        {see.assignments.length > 0 && (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-body text-sm font-semibold text-text-primary">Assignment History</h2>
              <p className="text-xs font-body text-text-tertiary mt-0.5">Edit assignments from the bishop&apos;s page.</p>
            </div>
            <ul className="divide-y divide-border">
              {see.assignments.map(a => (
                <li key={a.id} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/bishops/${a.person.id}`}
                        className="text-sm font-body font-medium text-text-primary hover:text-burgundy hover:underline truncate"
                      >
                        {formatName(a.person)}
                      </Link>
                      <span className="text-xs font-body text-text-tertiary capitalize flex-shrink-0">
                        {roleLabel(a.role)}
                      </span>
                    </div>
                    <p className="text-xs font-body text-text-tertiary mt-0.5">
                      {a.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {a.endDate
                        ? ` – ${a.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                        : ' – present'}
                    </p>
                  </div>
                  {a.isCurrent && (
                    <span className="flex-shrink-0 text-xs font-body font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                      Current
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  )
}
