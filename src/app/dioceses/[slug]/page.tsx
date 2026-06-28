import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getDioceseBySlug, type SuccessionEntry } from '@/lib/queries/dioceses'
import { SetBreadcrumbTitle } from '@/components/layout/SetBreadcrumbTitle'
import { formatRoleTitle } from '@/lib/utils/formatTitle'
import { formatProvinceName } from '@/lib/utils/formatProvinceName'
import { BishopPortrait } from '@/components/bishop/BishopPortrait'
import { isElectRole } from '@/lib/utils/roles'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const diocese = await getDioceseBySlug(params.slug)
  if (!diocese) return {}
  return { title: diocese.seeName }
}

const ORDINARY_ROLES = new Set(['ordinary', 'diocesan_bishop', 'archbishop', 'bishop_elect', 'archbishop_elect', 'coadjutor', 'apostolic_administrator', 'archbishop_emeritus', 'bishop_emeritus', 'coadjutor_emeritus'])
const AUXILIARY_ROLES = new Set(['auxiliary', 'auxiliary_bishop_elect', 'auxiliary_emeritus'])

function AffiliatedBishops({ succession }: { succession: SuccessionEntry[] }) {
  const current   = succession.filter(e => e.isCurrent)
  const fmrOrds   = succession.filter(e => !e.isCurrent && ORDINARY_ROLES.has(e.role))
  const fmrAuxs   = succession.filter(e => !e.isCurrent && AUXILIARY_ROLES.has(e.role))

  if (current.length === 0 && fmrOrds.length === 0 && fmrAuxs.length === 0) return null

  return (
    <section className="space-y-6">
      <h2 className="font-body text-xs font-semibold text-text-tertiary uppercase tracking-wide">
        Affiliated Bishops
      </h2>

      {current.length > 0 && (
        <div>
          <p className="text-[11px] font-body font-semibold text-text-tertiary uppercase tracking-widest mb-3">Current Leadership</p>
          <div className="space-y-2">
            {current.map(e => (
              <AffiliatedRow key={e.assignmentId} entry={e} />
            ))}
          </div>
        </div>
      )}

      {fmrOrds.length > 0 && (
        <div>
          <p className="text-[11px] font-body font-semibold text-text-tertiary uppercase tracking-widest mb-3">Former Ordinaries</p>
          <div className="space-y-2">
            {fmrOrds.map(e => (
              <AffiliatedRow key={e.assignmentId} entry={e} />
            ))}
          </div>
        </div>
      )}

      {fmrAuxs.length > 0 && (
        <div>
          <p className="text-[11px] font-body font-semibold text-text-tertiary uppercase tracking-widest mb-3">Former Auxiliaries</p>
          <div className="space-y-2">
            {fmrAuxs.map(e => (
              <AffiliatedRow key={e.assignmentId} entry={e} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function AffiliatedRow({ entry }: { entry: SuccessionEntry }) {
  const dateRange = `${fmtYear(entry.startDate)}–${entry.endDate ? fmtYear(entry.endDate) : 'present'}`
  const inner = (
    <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-surface transition-colors">
      <BishopPortrait
        src={entry.portraitUrl}
        name={entry.displayName}
        width={40}
        height={40}
        rankColor={entry.isCardinal ? '#C41E3A' : '#007A00'}
        barHeight={4}
      />
      <div className="min-w-0 flex-1">
        <p className="font-body text-sm font-medium text-text-primary leading-snug truncate">{entry.displayName}</p>
        <p className="font-body text-xs text-text-tertiary mt-0.5">{dateRange}</p>
      </div>
    </div>
  )
  return <Link href={`/bishops/${entry.slug}`}>{inner}</Link>
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return ''
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(d)
}

function fmtPopulation(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString('en-US')
}

function fmtArea(n: number): string {
  return `${Math.round(n).toLocaleString('en-US')} sq mi`
}

function fmtYear(d: Date | null | undefined): string {
  if (!d) return ''
  return String(new Date(d).getFullYear())
}

export default async function DioceseDetailPage({ params }: { params: { slug: string } }) {
  const diocese = await getDioceseBySlug(params.slug)
  if (!diocese) notFound()

  return (
    <div className="max-w-content mx-auto px-6 py-6 pb-24">
      <SetBreadcrumbTitle title={diocese.seeName} />

      {/* Back link */}
      <Link
        href="/dioceses"
        className="inline-flex items-center gap-1 text-sm font-body text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        All Dioceses
      </Link>

      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-text-primary leading-tight">
          {diocese.seeName}
        </h1>
        {diocese.metropolitanSee && (
          <p className="font-body text-base text-text-secondary mt-1">
            Suffragan of{' '}
            <Link
              href={`/dioceses/${diocese.metropolitanSee.slug}`}
              className="hover:text-burgundy transition-colors"
            >
              {formatProvinceName(diocese.metropolitanSee.name)}
            </Link>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: current leadership */}
        <div className="lg:col-span-2 space-y-8">
          {diocese.currentLeadership.length > 0 && (
            <section>
              <h2 className="font-body text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-4">
                Current Leadership
              </h2>
              <div className="space-y-3">
                {diocese.currentLeadership.map(leader => (
                  <Link
                    key={leader.assignmentId}
                    href={`/bishops/${leader.slug}`}
                    className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-surface transition-colors"
                  >
                    <BishopPortrait
                      src={leader.portraitUrl}
                      name={leader.displayName}
                      width={56}
                      height={56}
                      rankColor={leader.isCardinal ? '#C41E3A' : '#007A00'}
                      barHeight={5}
                    />
                    <div className="min-w-0">
                      <p className="font-display text-base font-medium text-text-primary leading-snug">
                        {leader.displayName}
                      </p>
                      <p className="font-body text-sm text-text-secondary mt-0.5">
                        {formatRoleTitle(leader.role, diocese.seeName)}
                        {isElectRole(leader.role) && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-body font-medium bg-tag text-text-secondary align-middle">
                            Bishop-elect
                          </span>
                        )}
                      </p>
                      <p className="font-body text-xs text-text-tertiary mt-0.5">
                        Since {fmtDate(leader.startDate)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Suffragan sees */}
          {diocese.suffraganSees.length > 0 && (
            <section>
              <h2 className="font-body text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-4">
                Suffragan Dioceses
              </h2>
              <div className="space-y-2">
                {diocese.suffraganSees.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <Link
                      href={`/dioceses/${s.slug}`}
                      className="font-body text-sm text-text-primary hover:text-burgundy transition-colors"
                    >
                      {s.seeName}
                    </Link>
                    {s.currentOrdinary && (
                      <Link
                        href={`/bishops/${s.currentOrdinary.slug}`}
                        className="font-body text-xs text-text-secondary hover:text-text-primary transition-colors"
                      >
                        {s.currentOrdinary.displayName}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Affiliated Bishops */}
          <AffiliatedBishops succession={diocese.succession} />
        </div>

        {/* Right: metadata */}
        <aside>
          {diocese.coatOfArmsUrl && (
            <div className="mb-6 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={diocese.coatOfArmsUrl}
                alt={`Coat of arms of ${diocese.seeName}`}
                className="max-w-[180px] w-full h-auto object-contain"
                style={{ maxHeight: 200 }}
              />
            </div>
          )}
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide mb-1">Type</dt>
              <dd className="text-sm font-body text-text-primary capitalize">{diocese.seeType.replace(/_/g, ' ')}</dd>
            </div>
            <div>
              <dt className="text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide mb-1">Rite</dt>
              <dd className="text-sm font-body text-text-primary">{diocese.rite.name}</dd>
            </div>
            {diocese.country && (
              <div>
                <dt className="text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide mb-1">Country</dt>
                <dd className="text-sm font-body text-text-primary">{diocese.country.name}</dd>
              </div>
            )}
            {diocese.stateRegion && (
              <div>
                <dt className="text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide mb-1">State / Region</dt>
                <dd className="text-sm font-body text-text-primary">{diocese.stateRegion}</dd>
              </div>
            )}
            {diocese.dateErected && (
              <div>
                <dt className="text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide mb-1">Erected</dt>
                <dd className="text-sm font-body text-text-primary">{fmtDate(diocese.dateErected)}</dd>
              </div>
            )}
            {diocese.cathedralName && (
              <div>
                <dt className="text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide mb-1">Cathedral</dt>
                <dd className="text-sm font-body text-text-primary">{diocese.cathedralName}</dd>
              </div>
            )}
            {diocese.coCathedralName && (
              <div>
                <dt className="text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide mb-1">Co-Cathedral</dt>
                <dd className="text-sm font-body text-text-primary">{diocese.coCathedralName}</dd>
              </div>
            )}
            {diocese.catholicPopulation != null && (
              <div>
                <dt className="text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide mb-1">
                  Catholic Population{diocese.statisticsYear ? ` (${diocese.statisticsYear})` : ''}
                </dt>
                <dd className="text-sm font-body text-text-primary">{fmtPopulation(diocese.catholicPopulation)}</dd>
              </div>
            )}
            {diocese.totalPopulation != null && (
              <div>
                <dt className="text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide mb-1">
                  Total Population{diocese.statisticsYear ? ` (${diocese.statisticsYear})` : ''}
                </dt>
                <dd className="text-sm font-body text-text-primary">{fmtPopulation(diocese.totalPopulation)}</dd>
              </div>
            )}
            {diocese.area != null && (
              <div>
                <dt className="text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide mb-1">Area</dt>
                <dd className="text-sm font-body text-text-primary">{fmtArea(diocese.area)}</dd>
              </div>
            )}
          </dl>
        </aside>
      </div>
    </div>
  )
}
