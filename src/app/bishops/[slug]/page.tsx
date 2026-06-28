import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { getBishopBySlug, getBishopLineage } from '@/lib/queries/bishops'
import { BishopPortrait } from '@/components/bishop/BishopPortrait'
import { BishopCard } from '@/components/bishop/BishopCard'
import { SelectBishopButton } from '@/components/bishop/SelectBishopButton'
import { DetailTabs } from '@/components/bishop/DetailTabs'
import { SetBreadcrumbTitle } from '@/components/layout/SetBreadcrumbTitle'
import { formatName } from '@/lib/utils/formatName'
import { formatSeeName } from '@/lib/utils/formatSeeName'
import { formatRoleTitle } from '@/lib/utils/formatTitle'
import { computeStyleOfAddress, getStyleOfAddressColor } from '@/lib/utils/styleOfAddress'
import { isElectRole } from '@/lib/utils/roles'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const bishop = await getBishopBySlug(params.slug)
  if (!bishop) return {}
  return { title: formatName(bishop, { honorific: false, isCardinal: !!bishop.cardinalate }) }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25

function yearsSpan(from: Date | null | undefined, to: Date): number | null {
  if (!from) return null
  const ms = to.getTime() - from.getTime()
  if (ms < 0) return null
  return Math.floor(ms / MS_PER_YEAR)
}

/** Human-readable duration for elapsed time: days → months → years. */
function yearsMonthsDuration(from: Date | null | undefined, to: Date): string | null {
  if (!from) return null
  const start = from instanceof Date ? from : new Date(from)
  const end = to instanceof Date ? to : new Date(to)
  if (end < start) return null

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  if (end.getDate() < start.getDate()) months -= 1
  if (months < 1) return 'less than 1 month'

  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  const parts: string[] = []
  if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`)
  if (remainingMonths > 0) parts.push(`${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`)
  return parts.join(', ')
}

function humanDuration(from: Date, to: Date): string {
  const ms = to.getTime() - from.getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (days < 31) return `${days} day${days !== 1 ? 's' : ''}`
  const months = Math.floor(days / 30.44)
  if (months < 24) return `${months} month${months !== 1 ? 's' : ''}`
  const years = Math.floor(ms / MS_PER_YEAR)
  return `${years} year${years !== 1 ? 's' : ''}`
}

/** The date a person turns a given age. */
function birthday(dob: Date, age: number): Date {
  return new Date(dob.getFullYear() + age, dob.getMonth(), dob.getDate())
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return ''
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(
    typeof d === 'string' ? new Date(d) : d,
  )
}

function fmtMonthYear(d: Date | null | undefined): string {
  if (!d) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(d)
}

const LIFE_EVENT_COLOR = '#7A1B2E'
const EPISCOPAL_EVENT_COLOR = '#007A00'
const CARDINAL_EVENT_COLOR = '#C41E3A'
const PRIESTHOOD_EVENT_COLOR = '#6B7280'
const US_COUNTRY_NAMES = new Set(['United States', 'United States of America', 'USA', 'U.S.A.'])

function cleanLocationPart(value: string | null | undefined): string | null {
  const cleaned = value?.trim()
  return cleaned || null
}

function formatLocationParts({
  city,
  state,
  country,
}: {
  city?: string | null
  state?: string | null
  country?: string | null
}): string | null {
  const cleanCity = cleanLocationPart(city)
  const cleanState = cleanLocationPart(state)
  const cleanCountry = cleanLocationPart(country)

  if (cleanCity && cleanState && cleanCountry) return `${cleanCity}, ${cleanState}, ${cleanCountry}`
  if (cleanCity && cleanState) return `${cleanCity}, ${cleanState}`
  if (cleanState && cleanCountry) return `${cleanState}, ${cleanCountry}`
  if (cleanCity && cleanCountry && !US_COUNTRY_NAMES.has(cleanCountry)) return `${cleanCity}, ${cleanCountry}`
  return cleanCity ?? cleanState ?? cleanCountry ?? null
}

function inferStateFromAssignments(
  city: string,
  bishop: NonNullable<Awaited<ReturnType<typeof getBishopBySlug>>>,
): string | null {
  const normalized = city.trim().toLowerCase()
  const match = bishop.assignments.find((assignment) => {
    const seeName = assignment.see.name.trim().toLowerCase()
    return seeName === normalized || seeName.includes(normalized) || normalized.includes(seeName)
  })
  return match?.see.stateRegion ?? null
}

function formatPersonalLocation(
  place: string | null | undefined,
  country: string | null | undefined,
  bishop: NonNullable<Awaited<ReturnType<typeof getBishopBySlug>>>,
): string | null {
  let cleanPlace = cleanLocationPart(place)
  const cleanCountry = cleanLocationPart(country)
  if (!cleanPlace) return cleanCountry ?? null

  if (cleanCountry && US_COUNTRY_NAMES.has(cleanCountry)) {
    const parts = cleanPlace.split(',').map((part) => part.trim()).filter(Boolean)
    if (parts.length === 2 && US_COUNTRY_NAMES.has(parts[1])) {
      cleanPlace = parts[0]
    }
  }

  if (cleanPlace.includes(',')) {
    return formatLocationParts({ city: cleanPlace, country: cleanCountry })
  }

  const inferredState = cleanCountry && US_COUNTRY_NAMES.has(cleanCountry)
    ? inferStateFromAssignments(cleanPlace, bishop)
    : null

  return formatLocationParts({ city: cleanPlace, state: inferredState, country: cleanCountry })
}

function formatSeeLocation(see: { name: string; stateRegion: string | null; country: { name: string } | null }): string | null {
  return formatLocationParts({ city: see.name, state: see.stateRegion, country: see.country?.name })
}

function detailWithDate(date: Date, location?: string | null): string {
  return [fmtDate(date), location].filter(Boolean).join(' · ')
}

// Small circular portrait thumbnail, optionally linked
function SmallPortrait({ src, name, href, isCardinal }: { src: string | null; name: string; href?: string; isCardinal?: boolean }) {
  const portrait = (
    <BishopPortrait
      src={src}
      name={name}
      width={48}
      height={48}
      rankColor={isCardinal ? '#C41E3A' : '#007A00'}
      barHeight={5}
    />
  )
  const cls = 'inline-flex flex-shrink-0'
  return href ? (
    <Link href={href} className={cls} title={name}>{portrait}</Link>
  ) : (
    <div className={cls}>{portrait}</div>
  )
}

// ─── Timeline builder ─────────────────────────────────────────────────────────

type TimelineEvent = {
  date: Date
  nodeColor: string
  label: string
  detail?: string | null
  persons?: { id: string; slug: string; name: string; portraitUrl: string | null; isCardinal: boolean }[]
  href?: string
}

function buildTimeline(bishop: NonNullable<Awaited<ReturnType<typeof getBishopBySlug>>>): TimelineEvent[] {
  const events: TimelineEvent[] = []

  if (bishop.dateOfBirth) {
    events.push({
      date: bishop.dateOfBirth,
      nodeColor: LIFE_EVENT_COLOR,
      label: 'Born',
      detail: detailWithDate(
        bishop.dateOfBirth,
        formatPersonalLocation(bishop.placeOfBirth, bishop.countryOfBirth?.name, bishop),
      ),
    })
  }

  if (bishop.priesthoodOrdination) {
    const ord = bishop.priesthoodOrdination
    events.push({
      date: ord.date,
      nodeColor: PRIESTHOOD_EVENT_COLOR,
      label: 'Ordained to the Priesthood',
      detail: detailWithDate(ord.date, formatPersonalLocation(ord.location, null, bishop)),
      persons: ord.ordainingBishop
        ? [{ id: ord.ordainingBishop.id, slug: ord.ordainingBishop.slug, name: formatName(ord.ordainingBishop, { isCardinal: !!ord.ordainingBishop.cardinalate }), portraitUrl: ord.ordainingBishop.portraitUrl, isCardinal: !!ord.ordainingBishop.cardinalate }]
        : undefined,
    })
  }

  for (const consecration of bishop.consecrations) {
    const persons = [
      consecration.principalConsecrator
        ? { id: consecration.principalConsecrator.id, slug: consecration.principalConsecrator.slug, name: formatName(consecration.principalConsecrator, { isCardinal: !!consecration.principalConsecrator.cardinalate }), portraitUrl: consecration.principalConsecrator.portraitUrl, isCardinal: !!consecration.principalConsecrator.cardinalate }
        : null,
      ...consecration.coConsecrators.map((cc) => ({
        id: cc.coConsecrator.id as string,
        slug: cc.coConsecrator.slug as string,
        name: formatName(cc.coConsecrator as Parameters<typeof formatName>[0], { isCardinal: !!(cc.coConsecrator as { cardinalate?: { id: string } | null }).cardinalate }),
        portraitUrl: cc.coConsecrator.portraitUrl as string | null,
        isCardinal: !!(cc.coConsecrator as { cardinalate?: { id: string } | null }).cardinalate,
      })),
    ].filter((p): p is NonNullable<typeof p> => p !== null)

    events.push({
      date: consecration.date,
      nodeColor: EPISCOPAL_EVENT_COLOR,
      label: 'Ordained Bishop',
      detail: detailWithDate(consecration.date, formatPersonalLocation(consecration.location, null, bishop)),
      persons: persons.length ? persons : undefined,
    })
  }

  if (bishop.cardinalate) {
    events.push({
      date: bishop.cardinalate.dateCreated,
      nodeColor: CARDINAL_EVENT_COLOR,
      label: 'Created Cardinal',
      detail: [
        fmtDate(bishop.cardinalate.dateCreated),
        bishop.cardinalate.cardinalOrder
          ? `Cardinal-${bishop.cardinalate.cardinalOrder.charAt(0).toUpperCase() + bishop.cardinalate.cardinalOrder.slice(1)}`
          : null,
        bishop.cardinalate.titularChurch,
      ].filter(Boolean).join(' · '),
    })
  }

  for (const asgn of bishop.assignments) {
    if (asgn.role === 'apostolic_administrator') continue

    const seeName = formatSeeName(asgn.see.name, asgn.see.seeType, asgn.see.namePrefixOverride)
    const roleLabel = formatRoleTitle(asgn.role, seeName)
    const seeLocation = formatSeeLocation(asgn.see)
    const appointedLabel = isElectRole(asgn.role)
      ? `Appointed ${roleLabel}`
      : `Appointed ${roleLabel} of ${asgn.see.name}`
    events.push({
      date: asgn.startDate,
      nodeColor: EPISCOPAL_EVENT_COLOR,
      label: appointedLabel,
      detail: detailWithDate(asgn.startDate, seeLocation),
      href: `/dioceses/${asgn.see.slug}`,
    })
    if (asgn.installedDate) {
      const installedLabel = isElectRole(asgn.role)
        ? `Ordained and Installed as ${roleLabel.replace(/-elect/g, '')}`
        : `Installed as ${roleLabel} of ${asgn.see.name}`
      events.push({
        date: asgn.installedDate,
        nodeColor: EPISCOPAL_EVENT_COLOR,
        label: installedLabel,
        detail: detailWithDate(asgn.installedDate, seeLocation),
        href: `/dioceses/${asgn.see.slug}`,
      })
    }
    if (
      asgn.endDate &&
      asgn.endReason !== 'transferred' &&
      asgn.endReason !== 'appointed_elsewhere' &&
      asgn.endReason !== 'succeeded'
    ) {
      const reason = asgn.endReason
        ? asgn.endReason.charAt(0).toUpperCase() + asgn.endReason.slice(1).replace(/_/g, ' ')
        : 'Ended'
      events.push({
        date: asgn.endDate,
        nodeColor: EPISCOPAL_EVENT_COLOR,
        label: `${reason} as ${roleLabel} of ${asgn.see.name}`,
        detail: detailWithDate(asgn.endDate, seeLocation),
      })
    }
  }

  if (bishop.dateOfDeath) {
    events.push({ date: bishop.dateOfDeath, nodeColor: LIFE_EVENT_COLOR, label: 'Died', detail: fmtDate(bishop.dateOfDeath) })
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime())
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BishopDetailPage({ params }: { params: { slug: string } }) {
  const bishop = await getBishopBySlug(params.slug)
  if (!bishop) notFound()
  const lineage = await getBishopLineage(bishop.id)
  const currentAsgn = bishop.assignments.find(a => a.isCurrent && a.role !== 'apostolic_administrator') ?? null
  const isCardinal = !!bishop.cardinalate

  const soa = computeStyleOfAddress({
    styleOfAddress: bishop.styleOfAddress,
    isCardinal,
    currentRole: currentAsgn?.role ?? null,
    riteType: bishop.rite.type,
    hasEpiscopalConsecration: bishop.consecrations.length > 0,
  })
  const soaColor = getStyleOfAddressColor(soa)
  const stripeColor = isCardinal ? '#C41E3A' : '#007A00'

  const currentSeeName = currentAsgn
    ? formatSeeName(currentAsgn.see.name, currentAsgn.see.seeType, currentAsgn.see.namePrefixOverride)
    : null
  const currentRoleTitle = currentAsgn && currentSeeName
    ? formatRoleTitle(currentAsgn.role, currentSeeName)
    : null

  const today   = new Date()
  const refDate = bishop.dateOfDeath ?? today
  const priestDuration   = yearsMonthsDuration(bishop.priesthoodOrdination?.date, refDate)
  const bishopDuration   = yearsMonthsDuration(bishop.consecrations[0]?.date, refDate)
  const cardinalDuration = isCardinal ? yearsMonthsDuration(bishop.cardinalate!.dateCreated, refDate) : null
  const age = yearsSpan(bishop.dateOfBirth, refDate)

  // Retirement countdown — only for living bishops with a non-emeritus current assignment
  const isActiveNonEmeritus =
    !bishop.dateOfDeath &&
    currentAsgn !== null &&
    !currentAsgn.role.endsWith('_emeritus')

  const retirementInfo = (() => {
    if (!isActiveNonEmeritus || !bishop.dateOfBirth) return null
    const dob = bishop.dateOfBirth instanceof Date ? bishop.dateOfBirth : new Date(bishop.dateOfBirth)
    const turns75 = birthday(dob, 75)
    if (today < turns75) {
      return { type: 'until', duration: yearsMonthsDuration(today, turns75) } as const
    }
    return { type: 'since', duration: humanDuration(turns75, today) } as const
  })()

  const timeline = buildTimeline(bishop)
  const consecrationsGiven = bishop.consecrationsAsConsecrator
  const birthLocation = formatPersonalLocation(bishop.placeOfBirth, bishop.countryOfBirth?.name, bishop)

  const tabs = [
    { id: 'timeline',      label: 'Timeline',             count: timeline.length },
    { id: 'lineage',       label: 'Lineage',               count: lineage.length },
    ...(consecrationsGiven.length > 0
      ? [{ id: 'consecrations', label: 'Consecrations Given', count: consecrationsGiven.length }]
      : []),
  ]

  // ── Timeline panel ──
  const timelinePanel = (
    <div className="relative">
      <div className="space-y-0">
        {timeline.length === 0 && (
          <p className="text-sm font-body text-text-secondary">No timeline data available.</p>
        )}
        {timeline.map((event, i) => (
          <div key={i} className="flex">
            {/* Date */}
            <div className="w-24 flex-shrink-0 pt-0.5 pr-3 text-right">
              <span className="text-xs font-body text-text-tertiary leading-tight">
                {fmtMonthYear(event.date)}
              </span>
            </div>
            {/* Node + line */}
            <div className="flex flex-col items-center mr-4 flex-shrink-0" style={{ width: 12 }}>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                style={{ backgroundColor: event.nodeColor, boxShadow: `0 0 0 3px white, 0 0 0 4px ${event.nodeColor}33` }}
              />
              {i < timeline.length - 1 && (
                <div className="w-px flex-1 bg-border" style={{ minHeight: 20 }} />
              )}
            </div>
            {/* Content */}
            <div className="flex-1 pb-5">
              <p className="text-sm font-body font-medium text-text-primary leading-snug">
                {event.href ? (
                  <Link href={event.href} className="hover:text-burgundy transition-colors">{event.label}</Link>
                ) : event.label}
              </p>
              {event.detail && (
                <p className="text-xs font-body text-text-tertiary mt-0.5">{event.detail}</p>
              )}
              {event.persons && event.persons.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-2">
                  {event.persons.map(p => (
                    <Link
                      key={p.id}
                      href={`/bishops/${p.slug}`}
                      className="inline-flex items-center gap-2 text-xs font-body text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <SmallPortrait src={p.portraitUrl} name={p.name} isCardinal={p.isCardinal} />
                      <span>{p.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // ── Lineage panel ──
  const lineagePanel = (
    <div>
      {lineage.length === 0 ? (
        <p className="text-sm font-body text-text-secondary">No lineage data available.</p>
      ) : (
        <>
          <p className="text-xs font-body text-text-tertiary uppercase tracking-wide mb-5">
            Ascending chain of principal consecrators
          </p>
          <div className="space-y-0">
            {lineage.map((person) => (
              <div key={person.id} className="flex items-center gap-4 py-2 border-b border-border last:border-b-0">
                <SmallPortrait src={person.portraitUrl} name={person.displayName} href={`/bishops/${person.slug}`} isCardinal={person.isCardinal} />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/bishops/${person.slug}`}
                    className="block text-sm font-body font-medium text-text-primary hover:text-burgundy transition-colors truncate"
                  >
                    {person.displayName}
                  </Link>
                  {person.currentTitle && (
                    <p className="text-xs font-body text-text-secondary truncate">{person.currentTitle}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )

  // ── Consecrations Given panel ──
  const consecrationsPanel = (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
      {consecrationsGiven.map(c => {
        const p = c.person
        const asgn = p.assignments[0] ?? null
        const cardStatus = p.dateOfDeath
          ? 'deceased'
          : asgn
            ? 'active'
            : 'retired'
        const cardStatusLabel = cardStatus === 'deceased'
          ? 'Deceased'
          : cardStatus === 'retired'
            ? 'Retired'
            : 'Active'
        return (
          <BishopCard
            key={c.id}
            bishop={{
              id: p.id,
              slug: p.slug,
              firstName: p.firstName,
              middleName: p.middleName,
              lastName: p.lastName,
              suffix: p.suffix,
              religiousOrder: p.religiousOrder?.abbreviation ?? null,
              religiousOrderId: null,
              religiousOrderFullName: null,
              portraitUrl: p.portraitUrl,
              displayName: formatName(p, { isCardinal: !!p.cardinalate }),
              styleOfAddress: computeStyleOfAddress({ styleOfAddress: p.styleOfAddress, isCardinal: !!p.cardinalate, currentRole: asgn?.role ?? null, riteType: p.rite.type }),
              currentAssignment: asgn
                ? {
                    id: asgn.id,
                    seeId: asgn.seeId,
                    seeSlug: asgn.see.slug,
                    role: asgn.role,
                    seeName: formatSeeName(asgn.see.name, asgn.see.seeType, asgn.see.namePrefixOverride),
                  }
                : null,
              isCardinal: !!p.cardinalate,
              status: cardStatus,
              statusLabel: cardStatusLabel,
              episcopalConsecrationDate: null,
            }}
          />
        )
      })}
    </div>
  )

  const panels: Record<string, React.ReactNode> = {
    timeline: timelinePanel,
    lineage: lineagePanel,
    ...(consecrationsGiven.length > 0 ? { consecrations: consecrationsPanel } : {}),
  }

  const breadcrumbName = formatName(bishop, { honorific: false, isCardinal })

  return (
    <div className="max-w-[920px] mx-auto px-6 py-6 pb-24">
      <SetBreadcrumbTitle title={breadcrumbName} />
      {/* Back link */}
      <Link
        href="/bishops"
        className="inline-flex items-center gap-1 text-sm font-body text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        All Bishops
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-8 mb-12">
        {/* Portrait */}
        <div className="flex-shrink-0">
          <BishopPortrait
            src={bishop.portraitUrl}
            name={bishop.displayName}
            width={240}
            height={320}
            rankColor={stripeColor}
            barHeight={bishop.photoCredit ? 28 : 8}
            photoCredit={bishop.photoCredit}
            priority
          />
        </div>

        {/* Biographical info */}
        <div className="flex-1 min-w-0 pt-1">
          {/* Style of address — italic, rank color, above name */}
          <p className="font-display italic text-[1.7rem] sm:text-[2.1rem] leading-snug mb-1" style={{ color: soaColor }}>
            {soa}
          </p>

          {/* Full name — Cormorant Garamond */}
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-text-primary leading-tight">
            {bishop.displayName}
          </h1>

          {/* Role title — text-secondary */}
          {currentRoleTitle && (
            <p className="font-body text-lg text-text-secondary mt-1 leading-snug">{currentRoleTitle}</p>
          )}

          {/* Current see — linked */}
          {currentSeeName && currentAsgn && (
            <Link
              href={`/dioceses/${currentAsgn.see.slug}`}
              className="block font-body text-base text-text-secondary hover:text-burgundy transition-colors mt-0.5"
            >
              {currentSeeName}
            </Link>
          )}

          {/* Biographical metadata */}
          <dl className="mt-5 space-y-1.5">
            {bishop.dateOfBirth && (
              <div className="flex gap-2 text-sm font-body">
                <dt className="text-text-tertiary w-36 flex-shrink-0">Born</dt>
                <dd className="text-text-primary">
                  {fmtDate(bishop.dateOfBirth)}
                  {birthLocation && ` · ${birthLocation}`}
                  {age != null && (
                    <span className="text-text-tertiary">
                      {' · '}{bishop.dateOfDeath ? 'Died aged' : 'Age'} {age}
                    </span>
                  )}
                </dd>
              </div>
            )}
            {bishop.priesthoodOrdination && (
              <div className="flex gap-2 text-sm font-body">
                <dt className="text-text-tertiary w-36 flex-shrink-0">Ordained priest</dt>
                <dd className="text-text-primary">{fmtDate(bishop.priesthoodOrdination.date)}</dd>
              </div>
            )}
            {bishop.consecrations[0] && (
              <div className="flex gap-2 text-sm font-body">
                <dt className="text-text-tertiary w-36 flex-shrink-0">Ordained bishop</dt>
                <dd className="text-text-primary">{fmtDate(bishop.consecrations[0].date)}</dd>
              </div>
            )}
            {bishop.dateOfDeath && (
              <div className="flex gap-2 text-sm font-body">
                <dt className="text-text-tertiary w-36 flex-shrink-0">Died</dt>
                <dd className="text-text-primary">{fmtDate(bishop.dateOfDeath)}</dd>
              </div>
            )}
            <div className="flex gap-2 text-sm font-body">
              <dt className="text-text-tertiary w-36 flex-shrink-0">Rite</dt>
              <dd className="text-text-primary">{bishop.rite.name}</dd>
            </div>
            {bishop.religiousOrder && (
              <div className="flex gap-2 text-sm font-body">
                <dt className="text-text-tertiary w-36 flex-shrink-0">Religious order</dt>
                <dd>
                  <Link
                    href={`/bishops?religiousOrder=${bishop.religiousOrder.id}`}
                    className="text-text-primary hover:text-burgundy transition-colors"
                  >
                    {bishop.religiousOrder.fullName}
                  </Link>
                </dd>
              </div>
            )}
          </dl>

          {/* Duration stats */}
          {(priestDuration != null || bishopDuration != null || cardinalDuration != null) && (
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1">
              {priestDuration != null && (
                <p className="text-xs font-body text-text-tertiary">
                  A priest for{' '}
                  <span className="text-text-secondary font-medium">{priestDuration}</span>
                </p>
              )}
              {bishopDuration != null && (
                <p className="text-xs font-body text-text-tertiary">
                  A bishop for{' '}
                  <span className="text-text-secondary font-medium">{bishopDuration}</span>
                </p>
              )}
              {cardinalDuration != null && (
                <p className="text-xs font-body text-text-tertiary">
                  A cardinal for{' '}
                  <span className="text-text-secondary font-medium">{cardinalDuration}</span>
                </p>
              )}
              {retirementInfo?.type === 'until' && (
                <p className="text-xs font-body text-text-tertiary">
                  <span className="text-text-secondary font-medium">{retirementInfo.duration}</span>
                  {' '}until canonical retirement
                </p>
              )}
              {retirementInfo?.type === 'since' && (
                <p className="text-xs font-body text-text-tertiary">
                  <span className="text-amber-600 font-medium">{retirementInfo.duration}</span>
                  {' '}since resignation submitted
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <SelectBishopButton id={bishop.id} name={bishop.displayName} />
            {bishop.catholicHierarchyId && (
              <a
                href={`https://www.catholic-hierarchy.org/bishop/b${bishop.catholicHierarchyId}.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-body text-text-secondary border border-border rounded-md hover:bg-surface transition-colors"
              >
                catholic-hierarchy.org <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {bishop.wikipediaUrl && (
              <a
                href={bishop.wikipediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-body text-text-secondary border border-border rounded-md hover:bg-surface transition-colors"
              >
                Wikipedia <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <DetailTabs tabs={tabs} panels={panels} />
    </div>
  )
}
