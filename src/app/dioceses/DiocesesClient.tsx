'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { SortControl, type SortDir } from './sort-control'
import { useDebounce } from '@/hooks/useDebounce'

const USMapView = dynamic(
  () => import('./USMapView').then(m => ({ default: m.USMapView })),
  { ssr: false, loading: () => <div className="h-80 bg-surface rounded-xl animate-pulse" /> },
)

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DioceseEntry {
  id: string
  slug: string
  seeName: string
  seeType: string
  isMetropolitan: boolean
  stateRegion: string | null
  seeCity: string | null
  provinceName: string
  dateErected: string | null
  riteName: string
  riteType: string
  isImmediatelySubjectToHolySee: boolean
  catholicPopulation: number | null
  totalPopulation: number | null
  area: number | null
  bishop: {
    slug: string
    displayName: string
    title: string
    portraitUrl: string | null
  } | null
  apostolicAdmin: {
    slug: string
    displayName: string
    portraitUrl: string | null
  } | null
}

type ViewMode       = 'all' | 'state' | 'province'
type AllSortKey     = 'name' | 'state' | 'province' | 'dateErected' | 'catholicPop' | 'totalPop' | 'area'
type ProvinceSortKey = 'alpha' | 'dateErected' | 'count' | 'catholicPop' | 'totalPop' | 'area'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  archdiocese:          'Archdiocese',
  diocese:              'Diocese',
  eparchy:              'Eparchy',
  archeparchy:          'Archeparchy',
  apostolic_exarchate:  'Apostolic Exarchate',
  personal_ordinariate: 'Personal Ordinariate',
  military_ordinariate: 'Military Ordinariate',
  military:             'Military Ordinariate',
}

function typeLabel(t: string) {
  return TYPE_LABELS[t] ?? t.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
}

const DEFAULTS: Record<string, string> = {
  view: 'all', q: '', types: '', rites: '', statuses: '',
  province: '', state: '', sort: 'name', dir: 'asc',
  popMin: '', popMax: '', totMin: '', totMax: '', areaMin: '', areaMax: '',
}

const EASTERN_CHURCH_LABELS: Record<string, string> = {
  Ruthenian: 'Byzantine Ruthenian Catholic Church',
  Ukrainian: 'Ukrainian Greek Catholic Church',
}

// ─── Comparison helpers ───────────────────────────────────────────────────────

export function cmpStr(a: string | null | undefined, b: string | null | undefined, dir: SortDir): number {
  const av = a ?? '￿'
  const bv = b ?? '￿'
  const c = av.localeCompare(bv)
  return dir === 'asc' ? c : -c
}

export function cmpNum(a: number | null | undefined, b: number | null | undefined, dir: SortDir): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return dir === 'asc' ? a - b : b - a
}

// ─── URL helpers ──────────────────────────────────────────────────────────────

function parseList(s: string | null): string[] {
  if (!s) return []
  return s.split(',').filter(Boolean)
}

function listParam(arr: string[]): string {
  return arr.join(',')
}

function toggleArr(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronRight({ className = '' }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

// ─── CheckboxGroup ────────────────────────────────────────────────────────────

function DebouncedSearchInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [localValue, setLocalValue] = useState(value)
  const debouncedValue = useDebounce(localValue, 500)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue)
    }
  }, [debouncedValue, value, onChange])

  return (
    <div className="relative">
      <SearchIcon />
      <input
        type="search"
        placeholder="Search..."
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className="w-full pl-8 pr-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors"
      />
    </div>
  )
}

function CheckboxGroup({
  label, options, selected, onToggle,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div>
      <p className="text-[11px] font-body font-semibold text-text-tertiary uppercase tracking-widest mb-2">
        {label}
      </p>
      <div className="space-y-1.5">
        {options.map(o => (
          <label key={o.value} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={() => onToggle(o.value)}
              className="w-3.5 h-3.5 rounded border-border accent-burgundy cursor-pointer"
            />
            <span className="text-sm font-body text-text-secondary group-hover:text-text-primary transition-colors select-none">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

// ─── FilterSelect ─────────────────────────────────────────────────────────────

function FilterSelect({
  label, value, options, onChange, placeholder,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div>
      <p className="text-[11px] font-body font-semibold text-text-tertiary uppercase tracking-widest mb-2">
        {label}
      </p>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-sm font-body border border-border rounded-lg px-3 py-1.5 bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors"
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ─── RangeFilter ──────────────────────────────────────────────────────────────

function RangeFilter({
  label, minVal, maxVal, onMinChange, onMaxChange, step = 1,
}: {
  label: string
  minVal: string
  maxVal: string
  onMinChange: (v: string) => void
  onMaxChange: (v: string) => void
  step?: number
}) {
  const cls = 'w-full text-sm font-body border border-border rounded-lg px-2.5 py-1.5 bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-burgundy/30 focus:border-burgundy transition-colors'
  return (
    <div>
      <p className="text-xs font-body text-text-secondary mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <input type="number" placeholder="Min" value={minVal} onChange={e => onMinChange(e.target.value)} step={step} min={0} className={cls} />
        <span className="text-xs text-text-tertiary flex-shrink-0">–</span>
        <input type="number" placeholder="Max" value={maxVal} onChange={e => onMaxChange(e.target.value)} step={step} min={0} className={cls} />
      </div>
    </div>
  )
}

// ─── FilterSidebar ────────────────────────────────────────────────────────────

interface SidebarProps {
  q: string
  onQChange: (v: string) => void
  selectedTypes: string[]
  onToggleType: (v: string) => void
  typeOptions: { value: string; label: string }[]
  selectedRites: string[]
  onToggleRite: (v: string) => void
  riteOptions: { value: string; label: string }[]
  selectedStatuses: string[]
  onToggleStatus: (v: string) => void
  selectedProvince: string
  onProvinceChange: (v: string) => void
  allProvinces: string[]
  selectedState: string
  onStateChange: (v: string) => void
  allStates: string[]
  hasCatholicPop: boolean
  hasTotalPop: boolean
  hasArea: boolean
  popMinStr: string
  popMaxStr: string
  totMinStr: string
  totMaxStr: string
  areaMinStr: string
  areaMaxStr: string
  onDemChange: (param: string, value: string) => void
  activeCount: number
  onClear: () => void
  showSearch?: boolean
}

function FilterSidebar({
  q, onQChange,
  selectedTypes, onToggleType, typeOptions,
  selectedRites, onToggleRite, riteOptions,
  selectedStatuses, onToggleStatus,
  selectedProvince, onProvinceChange, allProvinces,
  selectedState, onStateChange, allStates,
  hasCatholicPop, hasTotalPop, hasArea,
  popMinStr, popMaxStr, totMinStr, totMaxStr, areaMinStr, areaMaxStr,
  onDemChange,
  activeCount, onClear,
  showSearch = true,
}: SidebarProps) {
  const [demOpen, setDemOpen] = useState(false)
  const showDemographics = hasCatholicPop || hasTotalPop || hasArea

  return (
    <div className="space-y-5">
      {showSearch && <DebouncedSearchInput value={q} onChange={onQChange} />}
      {false && (
        <div className="relative">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search…"
            value={q}
            onChange={e => onQChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors"
          />
        </div>
      )}

      {typeOptions.length > 0 && (
        <CheckboxGroup
          label="Jurisdiction Type"
          options={typeOptions}
          selected={selectedTypes}
          onToggle={onToggleType}
        />
      )}

      <CheckboxGroup
        label="Rite"
        options={riteOptions}
        selected={selectedRites}
        onToggle={onToggleRite}
      />

      <CheckboxGroup
        label="Status"
        options={[
          { value: 'occupied', label: 'Occupied' },
          { value: 'vacant', label: 'Vacant' },
        ]}
        selected={selectedStatuses}
        onToggle={onToggleStatus}
      />

      {allProvinces.length > 0 && (
        <FilterSelect
          label="Province"
          value={selectedProvince}
          options={allProvinces}
          onChange={onProvinceChange}
          placeholder="All provinces"
        />
      )}

      {allStates.length > 0 && (
        <FilterSelect
          label="State"
          value={selectedState}
          options={allStates}
          onChange={onStateChange}
          placeholder="All states"
        />
      )}

      {showDemographics && (
        <div>
          <button
            onClick={() => setDemOpen(p => !p)}
            className="flex items-center justify-between w-full text-[11px] font-body font-semibold text-text-tertiary uppercase tracking-widest mb-2"
          >
            <span>Demographics</span>
            <ChevronRight className={`transition-transform duration-150 ${demOpen ? 'rotate-90' : ''}`} />
          </button>
          {demOpen && (
            <div className="space-y-3 mt-2">
              {hasCatholicPop && (
                <RangeFilter
                  label="Catholic Population"
                  minVal={popMinStr}
                  maxVal={popMaxStr}
                  onMinChange={v => onDemChange('popMin', v)}
                  onMaxChange={v => onDemChange('popMax', v)}
                  step={10000}
                />
              )}
              {hasTotalPop && (
                <RangeFilter
                  label="Total Population"
                  minVal={totMinStr}
                  maxVal={totMaxStr}
                  onMinChange={v => onDemChange('totMin', v)}
                  onMaxChange={v => onDemChange('totMax', v)}
                  step={10000}
                />
              )}
              {hasArea && (
                <RangeFilter
                  label="Area (sq mi)"
                  minVal={areaMinStr}
                  maxVal={areaMaxStr}
                  onMinChange={v => onDemChange('areaMin', v)}
                  onMaxChange={v => onDemChange('areaMax', v)}
                  step={100}
                />
              )}
            </div>
          )}
        </div>
      )}

      {activeCount > 0 && (
        <button
          onClick={onClear}
          className="text-xs font-body text-burgundy hover:underline underline-offset-2 w-full text-left"
        >
          Clear all filters ({activeCount})
        </button>
      )}
    </div>
  )
}

// ─── Badges ───────────────────────────────────────────────────────────────────

interface Badge { label: string; variant: 'vacant' | 'tag' }

function getBadges(d: DioceseEntry): Badge[] {
  const badges: Badge[] = []
  if (!d.bishop && !d.apostolicAdmin) badges.push({ label: 'Vacant', variant: 'vacant' })
  if (d.riteType === 'eastern') {
    badges.push({ label: 'Eastern Catholic', variant: 'tag' })
    badges.push({ label: d.riteName, variant: 'tag' })
  }
  if (d.isImmediatelySubjectToHolySee) badges.push({ label: 'Immediately Subject to the Holy See', variant: 'tag' })
  if (d.seeType === 'personal_ordinariate') badges.push({ label: 'Personal Ordinariate', variant: 'tag' })
  if (d.seeType === 'military' || d.seeType === 'military_ordinariate') badges.push({ label: 'Military', variant: 'tag' })
  return badges
}

function BadgePill({ badge }: { badge: Badge }) {
  if (badge.variant === 'vacant') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-body font-semibold tracking-wide bg-burgundy text-white flex-shrink-0">
        Vacant
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-body font-medium bg-tag text-text-secondary flex-shrink-0">
      {badge.label}
    </span>
  )
}

// ─── Flat table row (All view) ────────────────────────────────────────────────

function FlatTableRow({ d }: { d: DioceseEntry }) {
  const badges = getBadges(d)

  let bishopCell: React.ReactNode
  if (d.bishop) {
    bishopCell = (
      <Link href={`/bishops/${d.bishop.slug}`} className="hover:text-burgundy transition-colors">
        <span className="block">{d.bishop.displayName}</span>
        <span className="block text-xs text-text-tertiary">{d.bishop.title}</span>
      </Link>
    )
  } else if (d.apostolicAdmin) {
    bishopCell = (
      <Link href={`/bishops/${d.apostolicAdmin.slug}`} className="hover:text-burgundy transition-colors">
        <span className="block">{d.apostolicAdmin.displayName}</span>
        <span className="block text-xs text-text-tertiary">Apostolic Administrator</span>
      </Link>
    )
  } else {
    bishopCell = <span className="italic text-text-tertiary">Vacant</span>
  }

  return (
    <tr className="border-b border-border hover:bg-surface transition-colors">
      <td className="px-4 py-3 align-top">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <Link
            href={`/dioceses/${d.slug}`}
            className="font-display text-sm font-semibold text-text-primary hover:text-burgundy transition-colors"
          >
            {d.seeName}
          </Link>
          {badges.filter(b => b.variant === 'vacant').map(b => <BadgePill key={b.label} badge={b} />)}
        </div>
        {badges.filter(b => b.variant === 'tag').length > 0 && (
          <div className="flex gap-1 flex-wrap mt-0.5">
            {badges.filter(b => b.variant === 'tag').map(b => <BadgePill key={b.label} badge={b} />)}
          </div>
        )}
      </td>
      <td className="px-4 py-3 align-top text-sm font-body text-text-secondary">
        {bishopCell}
      </td>
      <td className="px-4 py-3 align-top text-sm font-body text-text-secondary hidden sm:table-cell">
        {d.stateRegion ?? '—'}
      </td>
      <td className="px-4 py-3 align-top text-sm font-body text-text-secondary hidden lg:table-cell">
        {d.provinceName}
      </td>
    </tr>
  )
}

// ─── Province row (Province view) ─────────────────────────────────────────────

function ProvinceRow({
  d,
  isMetro,
}: {
  d: DioceseEntry
  isMetro: boolean
}) {
  const badges = getBadges(d)

  let bishopCell: React.ReactNode
  if (d.bishop) {
    bishopCell = (
      <Link href={`/bishops/${d.bishop.slug}`} className="hover:text-burgundy transition-colors">
        <span className="block">{d.bishop.displayName}</span>
        <span className="block text-xs text-text-tertiary">{d.bishop.title}</span>
      </Link>
    )
  } else if (d.apostolicAdmin) {
    bishopCell = (
      <Link href={`/bishops/${d.apostolicAdmin.slug}`} className="hover:text-burgundy transition-colors">
        <span className="block">{d.apostolicAdmin.displayName}</span>
        <span className="block text-xs text-text-tertiary">Apostolic Administrator</span>
      </Link>
    )
  } else {
    bishopCell = <span className="italic text-text-tertiary">Vacant</span>
  }

  return (
    <tr className="border-b border-border hover:bg-surface/60 transition-colors">
      <td className="px-4 py-3 align-top">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <Link
            href={`/dioceses/${d.slug}`}
            className={`font-display text-sm hover:text-burgundy transition-colors ${isMetro ? 'font-bold' : 'font-semibold'} text-text-primary`}
          >
            {d.seeName}
          </Link>
          {isMetro && (
            <span className="text-[10px] font-body text-text-tertiary uppercase tracking-wide flex-shrink-0">
              Metropolitan
            </span>
          )}
          {badges.filter(b => b.variant === 'vacant').map(b => <BadgePill key={b.label} badge={b} />)}
        </div>
        {badges.filter(b => b.variant === 'tag').length > 0 && (
          <div className="flex gap-1 flex-wrap mt-0.5">
            {badges.filter(b => b.variant === 'tag').map(b => <BadgePill key={b.label} badge={b} />)}
          </div>
        )}
      </td>
      <td className="px-4 py-3 align-top text-sm font-body text-text-secondary">
        {bishopCell}
      </td>
      <td className="px-4 py-3 align-top text-sm font-body text-text-secondary hidden sm:table-cell text-right">
        {d.stateRegion ?? '—'}
      </td>
    </tr>
  )
}

// ─── Province card ─────────────────────────────────────────────────────────────

function ProvinceCard({
  name,
  metropolitan,
  items,
  isOpen,
  onToggle,
  hasCatholicPop,
  hasTotalPop,
  hasArea,
}: {
  name: string
  metropolitan: DioceseEntry | null
  items: DioceseEntry[]
  isOpen: boolean
  onToggle: () => void
  hasCatholicPop: boolean
  hasTotalPop: boolean
  hasArea: boolean
}) {
  const [innerSort, setInnerSort] = useState('alpha')
  const [innerDir, setInnerDir]   = useState<SortDir>('asc')

  const innerSortOptions = useMemo(() => [
    { key: 'alpha',       label: 'A–Z'          },
    { key: 'dateErected', label: 'Date Erected'  },
    ...(hasCatholicPop ? [{ key: 'catholicPop', label: 'Catholic Pop.' }] : []),
    ...(hasTotalPop    ? [{ key: 'totalPop',    label: 'Total Pop.'    }] : []),
    ...(hasArea        ? [{ key: 'area',        label: 'Area'          }] : []),
  ], [hasCatholicPop, hasTotalPop, hasArea])

  const sortedItems = useMemo(() => {
    const metro = items.filter(d => d.isMetropolitan)
    const rest  = items.filter(d => !d.isMetropolitan).sort((a, b) => {
      switch (innerSort) {
        case 'dateErected': return cmpStr(a.dateErected, b.dateErected, innerDir)
        case 'catholicPop': return cmpNum(a.catholicPopulation, b.catholicPopulation, innerDir)
        case 'totalPop':    return cmpNum(a.totalPopulation, b.totalPopulation, innerDir)
        case 'area':        return cmpNum(a.area, b.area, innerDir)
        default:            return cmpStr(a.seeName, b.seeName, innerDir)
      }
    })
    return [...metro, ...rest]
  }, [items, innerSort, innerDir])

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 bg-surface text-left group"
        aria-expanded={isOpen}
      >
        <span className="font-display text-lg font-semibold text-text-primary leading-snug">
          {name}
        </span>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs font-body text-text-tertiary">{items.length}</span>
          <ChevronRight
            className={`text-text-tertiary transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <>
          {/* Sub-header: metropolitan name + inner sort */}
          <div className="border-t border-border bg-surface px-5 py-2.5 flex items-center justify-between gap-4 flex-wrap">
            {metropolitan?.bishop ? (
              <p className="text-xs font-body text-text-tertiary truncate flex-shrink-0">
                Metropolitan:{' '}
                <Link
                  href={`/bishops/${metropolitan.bishop.slug}`}
                  onClick={e => e.stopPropagation()}
                  className="hover:text-text-primary transition-colors"
                >
                  {metropolitan.bishop.displayName}
                </Link>
              </p>
            ) : (
              <span />
            )}
            <SortControl
              label="Sort:"
              options={innerSortOptions}
              value={innerSort}
              dir={innerDir}
              onSort={(key, dir) => { setInnerSort(key); setInnerDir(dir) }}
            />
          </div>

          {/* Rows */}
          <div className="bg-white">
            <table className="w-full">
              <tbody className="divide-y divide-border">
                {sortedItems.map(d => (
                  <ProvinceRow key={d.id} d={d} isMetro={d.isMetropolitan} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DiocesesClient({
  dioceses,
  hasCatholicPop = false,
  hasTotalPop = false,
  hasArea = false,
}: {
  dioceses: DioceseEntry[]
  hasCatholicPop?: boolean
  hasTotalPop?: boolean
  hasArea?: boolean
}) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const view             = (searchParams.get('view')     ?? 'all') as ViewMode
  const q                = searchParams.get('q')          ?? ''
  const selectedTypes    = parseList(searchParams.get('types'))
  const selectedRites    = parseList(searchParams.get('rites'))
  const selectedStatuses = parseList(searchParams.get('statuses'))
  const selectedProvince = searchParams.get('province')   ?? ''
  const selectedState    = searchParams.get('state')      ?? ''
  const sortKey          = (searchParams.get('sort')      ?? 'name') as AllSortKey
  const sortDir          = (searchParams.get('dir')       ?? 'asc') as SortDir
  const popMinStr        = searchParams.get('popMin')     ?? ''
  const popMaxStr        = searchParams.get('popMax')     ?? ''
  const totMinStr        = searchParams.get('totMin')     ?? ''
  const totMaxStr        = searchParams.get('totMax')     ?? ''
  const areaMinStr       = searchParams.get('areaMin')    ?? ''
  const areaMaxStr       = searchParams.get('areaMax')    ?? ''

  const popMin  = popMinStr  ? parseInt(popMinStr,  10)  : null
  const popMax  = popMaxStr  ? parseInt(popMaxStr,  10)  : null
  const totMin  = totMinStr  ? parseInt(totMinStr,  10)  : null
  const totMax  = totMaxStr  ? parseInt(totMaxStr,  10)  : null
  const areaMin = areaMinStr ? parseFloat(areaMinStr)    : null
  const areaMax = areaMaxStr ? parseFloat(areaMaxStr)    : null

  const [drawerOpen, setDrawerOpen]             = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [openSections, setOpenSections]         = useState<Set<string>>(new Set())
  const [provinceSortKey, setProvinceSortKey]   = useState<ProvinceSortKey>('alpha')
  const [provinceSortDir, setProvinceSortDir]   = useState<SortDir>('asc')

  useEffect(() => {
    if (!drawerOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  // ── URL updates ────────────────────────────────────────────────────────────

  const update = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (!v || v === (DEFAULTS[k] ?? '')) params.delete(k)
        else params.set(k, v)
      }
      const qs = params.toString()
      router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false })
    },
    [searchParams, router],
  )

  // ── Derived option lists ───────────────────────────────────────────────────

  const typeOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const d of dioceses) {
      if (!seen.has(d.seeType)) seen.set(d.seeType, typeLabel(d.seeType))
    }
    return Array.from(seen.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [dioceses])

  const riteOptions = useMemo(() => {
    const easternRites = Array.from(
      new Set(dioceses.filter(d => d.riteType === 'eastern').map(d => d.riteName)),
    ).sort()
    return [
      { value: 'latin', label: 'Latin' },
      ...easternRites.map(name => ({
        value: `rite:${name}`,
        label: EASTERN_CHURCH_LABELS[name] ?? `${name} Catholic Church`,
      })),
    ]
  }, [dioceses])

  const allProvinces = useMemo(
    () => Array.from(new Set(dioceses.filter(d => d.riteType === 'latin').map(d => d.provinceName))).sort(),
    [dioceses],
  )

  const allStates = useMemo(
    () => Array.from(new Set(dioceses.map(d => d.stateRegion).filter((s): s is string => !!s))).sort(),
    [dioceses],
  )

  // ── All view sort options (conditional on data) ────────────────────────────

  const allSortOptions = useMemo(() => [
    { key: 'name',        label: 'Alphabetical'         },
    { key: 'state',       label: 'By State'             },
    { key: 'province',    label: 'By Province'          },
    { key: 'dateErected', label: 'By Date Erected'      },
    ...(hasCatholicPop ? [{ key: 'catholicPop', label: 'By Catholic Pop.' }] : []),
    ...(hasTotalPop    ? [{ key: 'totalPop',    label: 'By Total Pop.'    }] : []),
    ...(hasArea        ? [{ key: 'area',        label: 'By Area (sq mi)'  }] : []),
  ], [hasCatholicPop, hasTotalPop, hasArea])

  // ── Province sort options (conditional on data) ────────────────────────────

  const provinceSortOptions = useMemo(() => [
    { key: 'alpha',       label: 'Alphabetical'    },
    { key: 'dateErected', label: 'By Date Erected' },
    { key: 'count',       label: 'By Size'         },
    ...(hasCatholicPop ? [{ key: 'catholicPop', label: 'By Catholic Pop.' }] : []),
    ...(hasTotalPop    ? [{ key: 'totalPop',    label: 'By Total Pop.'    }] : []),
    ...(hasArea        ? [{ key: 'area',        label: 'By Area (sq mi)'  }] : []),
  ], [hasCatholicPop, hasTotalPop, hasArea])

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const lq = q.toLowerCase().trim()
    return dioceses.filter(d => {
      if (lq) {
        const haystack = [d.seeName, d.stateRegion, d.seeCity, d.bishop?.displayName, d.apostolicAdmin?.displayName, d.provinceName]
          .filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(lq)) return false
        return true
      }
      if (selectedTypes.length > 0 && !selectedTypes.includes(d.seeType)) return false
      if (selectedRites.length > 0) {
        const riteMatches = selectedRites.includes(d.riteType) || selectedRites.includes(`rite:${d.riteName}`)
        if (!riteMatches) return false
      }
      if (selectedStatuses.length > 0) {
        const occupied = !!(d.bishop || d.apostolicAdmin)
        if (selectedStatuses.length === 1) {
          if (selectedStatuses[0] === 'occupied' && !occupied) return false
          if (selectedStatuses[0] === 'vacant'   && occupied)  return false
        }
      }
      if (selectedProvince && (d.riteType !== 'latin' || d.provinceName !== selectedProvince)) return false
      if (selectedState    && d.stateRegion   !== selectedState)   return false

      // Demographic range filters — nulls excluded when a bound is active
      if (popMin !== null || popMax !== null) {
        if (d.catholicPopulation === null) return false
        if (popMin !== null && d.catholicPopulation < popMin) return false
        if (popMax !== null && d.catholicPopulation > popMax) return false
      }
      if (totMin !== null || totMax !== null) {
        if (d.totalPopulation === null) return false
        if (totMin !== null && d.totalPopulation < totMin) return false
        if (totMax !== null && d.totalPopulation > totMax) return false
      }
      if (areaMin !== null || areaMax !== null) {
        if (d.area === null) return false
        if (areaMin !== null && d.area < areaMin) return false
        if (areaMax !== null && d.area > areaMax) return false
      }

      return true
    })
  }, [dioceses, q, selectedTypes, selectedRites, selectedStatuses, selectedProvince, selectedState, popMin, popMax, totMin, totMax, areaMin, areaMax])

  // ── Sort (flat view) ───────────────────────────────────────────────────────

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'state':       return cmpStr(a.stateRegion,  b.stateRegion,  sortDir)
        case 'province':    return cmpStr(a.provinceName, b.provinceName, sortDir)
        case 'dateErected': return cmpStr(a.dateErected,  b.dateErected,  sortDir)
        case 'catholicPop': return cmpNum(a.catholicPopulation, b.catholicPopulation, sortDir)
        case 'totalPop':    return cmpNum(a.totalPopulation,    b.totalPopulation,    sortDir)
        case 'area':        return cmpNum(a.area, b.area, sortDir)
        default:            return cmpStr(a.seeName, b.seeName, sortDir)
      }
    })
  }, [filtered, sortKey, sortDir])

  // ── Grouped data ───────────────────────────────────────────────────────────

  const stateGroups = useMemo(() => {
    const map = new Map<string, DioceseEntry[]>()
    for (const d of filtered) {
      const key = d.stateRegion ?? 'Other'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(d)
    }
    return Array.from(map.entries())
      .map(([name, items]) => ({ name, items: [...items].sort((a, b) => a.seeName.localeCompare(b.seeName)) }))
      .sort((a, b) => {
        if (a.name === 'Other') return 1
        if (b.name === 'Other') return -1
        return a.name.localeCompare(b.name)
      })
  }, [filtered])

  const provinceGroups = useMemo(() => {
    const map = new Map<string, DioceseEntry[]>()
    for (const d of filtered.filter(d => d.riteType === 'latin')) {
      if (!map.has(d.provinceName)) map.set(d.provinceName, [])
      map.get(d.provinceName)!.push(d)
    }
    const groups = Array.from(map.entries()).map(([name, items]) => ({
      name,
      metropolitan: items.find(d => d.isMetropolitan) ?? null,
      items,
      catholicPopSum: items.reduce((s, d) => s + (d.catholicPopulation ?? 0), 0),
      totalPopSum:    items.reduce((s, d) => s + (d.totalPopulation    ?? 0), 0),
      areaSum:        items.reduce((s, d) => s + (d.area               ?? 0), 0),
    }))

    return [...groups].sort((a, b) => {
      let cmp: number
      switch (provinceSortKey) {
        case 'count':
          cmp = a.items.length - b.items.length
          break
        case 'dateErected': {
          const ad = a.metropolitan?.dateErected ?? '9999-99-99'
          const bd = b.metropolitan?.dateErected ?? '9999-99-99'
          cmp = ad.localeCompare(bd)
          break
        }
        case 'catholicPop': cmp = a.catholicPopSum - b.catholicPopSum; break
        case 'totalPop':    cmp = a.totalPopSum    - b.totalPopSum;    break
        case 'area':        cmp = a.areaSum        - b.areaSum;        break
        default:
          cmp = a.name.localeCompare(b.name)
      }
      return provinceSortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, provinceSortKey, provinceSortDir])

  const easternChurchGroups = useMemo(() => {
    const eastern = filtered.filter(d => d.riteType === 'eastern')
    const ruthenian = eastern.filter(d => d.riteName === 'Ruthenian')
    const ukrainian = eastern.filter(d => d.riteName === 'Ukrainian')
    const other = eastern
      .filter(d => d.riteName !== 'Ruthenian' && d.riteName !== 'Ukrainian')
      .sort((a, b) => a.riteName.localeCompare(b.riteName) || a.seeName.localeCompare(b.seeName))

    const groups: Array<{ name: string; metropolitan: DioceseEntry | null; items: DioceseEntry[] }> = []
    if (ruthenian.length) {
      groups.push({
        name: EASTERN_CHURCH_LABELS.Ruthenian,
        metropolitan: ruthenian.find(d => d.isMetropolitan) ?? null,
        items: ruthenian,
      })
    }
    if (ukrainian.length) {
      groups.push({
        name: EASTERN_CHURCH_LABELS.Ukrainian,
        metropolitan: ukrainian.find(d => d.isMetropolitan) ?? null,
        items: ukrainian,
      })
    }
    if (other.length) {
      groups.push({
        name: 'Other Eastern Catholic Churches',
        metropolitan: null,
        items: other,
      })
    }
    return groups
  }, [filtered])

  // ── Section state ──────────────────────────────────────────────────────────

  const hasActiveFilters = !!(q || selectedTypes.length || selectedRites.length || selectedStatuses.length || selectedProvince || selectedState || popMin !== null || popMax !== null || totMin !== null || totMax !== null || areaMin !== null || areaMax !== null)

  function isSectionOpen(name: string) {
    return hasActiveFilters || openSections.has(name)
  }

  function toggleSection(name: string) {
    if (hasActiveFilters) return
    setOpenSections(prev => {
      const next = new Set(Array.from(prev))
      if (next.has(name)) next.delete(name); else next.add(name)
      return next
    })
  }

  // ── Active filter count ────────────────────────────────────────────────────

  const activeFilterCount = [
    selectedTypes.length > 0,
    selectedRites.length > 0,
    selectedStatuses.length > 0,
    !!selectedProvince,
    !!selectedState,
    !!(popMinStr || popMaxStr),
    !!(totMinStr || totMaxStr),
    !!(areaMinStr || areaMaxStr),
  ].filter(Boolean).length

  function clearFilters() {
    update({ types: '', rites: '', statuses: '', province: '', state: '', popMin: '', popMax: '', totMin: '', totMax: '', areaMin: '', areaMax: '' })
  }

  const updateSearch = useCallback((value: string) => {
    update({ q: value })
  }, [update])

  // ── Sidebar props ──────────────────────────────────────────────────────────

  const sidebarProps: SidebarProps = {
    q, onQChange: updateSearch,
    selectedTypes, onToggleType: v => update({ types: listParam(toggleArr(selectedTypes, v)) }),
    typeOptions,
    selectedRites, onToggleRite: v => update({ rites: listParam(toggleArr(selectedRites, v)) }),
    riteOptions,
    selectedStatuses, onToggleStatus: v => update({ statuses: listParam(toggleArr(selectedStatuses, v)) }),
    selectedProvince, onProvinceChange: v => update({ province: v }), allProvinces,
    selectedState, onStateChange: v => update({ state: v }), allStates,
    hasCatholicPop, hasTotalPop, hasArea,
    popMinStr, popMaxStr, totMinStr, totMaxStr, areaMinStr, areaMaxStr,
    onDemChange: (param, value) => update({ [param]: value }),
    activeCount: activeFilterCount, onClear: clearFilters,
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-6 pb-24">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-body text-text-tertiary mb-1">
        <span>Worldwide</span>
        <span>→</span>
        <span>North America</span>
        <span>→</span>
        <span className="text-text-secondary font-medium">United States</span>
      </nav>

      {/* Page title */}
      <div className="mb-5">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-text-primary leading-tight">
          Dioceses
        </h1>
        <p className="font-body text-sm text-text-tertiary mt-0.5">
          {dioceses.length} jurisdictions
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">

        {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
        {!sidebarCollapsed && (
          <aside className="hidden sm:block w-60 flex-shrink-0 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-body font-semibold text-text-tertiary uppercase tracking-widest">
                Filters
              </span>
              <button
                onClick={() => setSidebarCollapsed(true)}
                title="Collapse filters"
                className="p-0.5 rounded text-text-tertiary hover:text-text-primary transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <FilterSidebar {...sidebarProps} />
          </aside>
        )}

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Mobile: search + Filters button */}
          <div className="flex items-center gap-2 mb-3 sm:hidden">
            <div className="flex-1">
              <DebouncedSearchInput value={q} onChange={updateSearch} />
            </div>
            {false && <div className="relative flex-1">
              <SearchIcon />
              <input
                type="search"
                placeholder="Search…"
                value={q}
                onChange={e => update({ q: e.target.value })}
                className="w-full pl-8 pr-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors"
              />
            </div>}
            <button
              onClick={() => setDrawerOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-body rounded-lg border transition-colors flex-shrink-0 ${
                activeFilterCount > 0
                  ? 'bg-burgundy text-white border-burgundy'
                  : 'bg-white text-text-secondary border-border hover:border-burgundy/50 hover:text-text-primary'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white/25 text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop: collapsed sidebar toggle */}
          {sidebarCollapsed && (
            <div className="hidden sm:flex items-center gap-2 mb-3">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="flex items-center gap-1.5 text-xs font-body text-text-secondary hover:text-text-primary border border-border rounded-lg px-3 py-1.5 bg-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 bg-burgundy text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* View tabs */}
          <div className="flex items-center border-b border-border mb-4">
            {(['all', 'state', 'province'] as const).map(v => (
              <button
                key={v}
                onClick={() => { update({ view: v }); setOpenSections(new Set()) }}
                className={`px-4 py-2.5 text-sm font-body font-medium border-b-2 -mb-px transition-colors ${
                  view === v
                    ? 'border-burgundy text-burgundy'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {v === 'all' ? 'All' : v === 'state' ? 'By State' : 'By Province'}
              </button>
            ))}
            <button
              disabled
              className="px-4 py-2.5 text-sm font-body font-medium border-b-2 -mb-px border-transparent text-text-tertiary cursor-not-allowed opacity-60"
              title="Coming soon"
            >
              Map
            </button>
          </div>

          {/* Result count */}
          <p className="text-sm font-body text-text-tertiary mb-4">
            Showing{' '}
            <span className="text-text-primary font-medium">{filtered.length}</span>
            {' '}of {dioceses.length} jurisdictions
            {q.trim() ? <span className="ml-1">matching &ldquo;{q.trim()}&rdquo;</span> : null}
          </p>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-body text-text-secondary">No dioceses match your filters.</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-2 text-sm font-body text-burgundy hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* ── All — flat table with sort control ───────────────────────── */}
          {view === 'all' && filtered.length > 0 && (
            <div>
              <SortControl
                options={allSortOptions}
                value={sortKey}
                dir={sortDir}
                onSort={(key, dir) => update({ sort: key, dir })}
                className="mb-4"
              />
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-surface">
                        <th className="px-4 py-3 text-left text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide">Diocese</th>
                        <th className="px-4 py-3 text-left text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide">Bishop</th>
                        <th className="px-4 py-3 text-left text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide hidden sm:table-cell">State</th>
                        <th className="px-4 py-3 text-left text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide hidden lg:table-cell">Province</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sorted.map(d => <FlatTableRow key={d.id} d={d} />)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── By State — US map ─────────────────────────────────────────── */}
          {view === 'state' && filtered.length > 0 && (
            <USMapView
              stateGroups={stateGroups}
              hasCatholicPop={hasCatholicPop}
              hasTotalPop={hasTotalPop}
              hasArea={hasArea}
            />
          )}

          {/* ── By Province ───────────────────────────────────────────────── */}
          {view === 'province' && filtered.length > 0 && (
            <>
              <SortControl
                options={provinceSortOptions}
                value={provinceSortKey}
                dir={provinceSortDir}
                onSort={(key, dir) => { setProvinceSortKey(key as ProvinceSortKey); setProvinceSortDir(dir) }}
                className="mb-4"
              />
              <div className="space-y-2">
                {provinceGroups.map(({ name, metropolitan, items }) => (
                  <ProvinceCard
                    key={name}
                    name={name}
                    metropolitan={metropolitan}
                    items={items}
                    isOpen={isSectionOpen(name)}
                    onToggle={() => toggleSection(name)}
                    hasCatholicPop={hasCatholicPop}
                    hasTotalPop={hasTotalPop}
                    hasArea={hasArea}
                  />
                ))}
                {easternChurchGroups.length > 0 && (
                  <section className="pt-6">
                    <div className="mb-3">
                      <h2 className="font-display text-xl font-semibold text-text-primary">
                        Eastern Catholic Churches
                      </h2>
                      <p className="font-body text-sm text-text-secondary mt-1 max-w-3xl">
                        Eastern Catholic churches in the United States maintain their own hierarchical structures separate from the Latin-rite province system.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {easternChurchGroups.map(({ name, metropolitan, items }) => (
                        <ProvinceCard
                          key={name}
                          name={name}
                          metropolitan={metropolitan}
                          items={items}
                          isOpen={isSectionOpen(name)}
                          onToggle={() => toggleSection(name)}
                          hasCatholicPop={hasCatholicPop}
                          hasTotalPop={hasTotalPop}
                          hasArea={hasArea}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Mobile drawer ───────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm font-body font-semibold text-text-primary">Filters</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 text-text-tertiary hover:text-text-primary transition-colors rounded"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <FilterSidebar {...sidebarProps} showSearch={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
