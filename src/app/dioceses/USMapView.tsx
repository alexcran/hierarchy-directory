'use client'

import { useState, useMemo } from 'react'
import { ComposableMap, Geographies, Geography, type Geography as GeoFeature } from 'react-simple-maps'
import Link from 'next/link'
import type { DioceseEntry } from './DiocesesClient'
import { SortControl, type SortDir } from './sort-control'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

// ─── Local sort helpers (mirrors DiocesesClient) ───────────────────────────────

function cmpStr(a: string | null | undefined, b: string | null | undefined, dir: SortDir): number {
  const c = (a ?? '￿').localeCompare(b ?? '￿')
  return dir === 'asc' ? c : -c
}

function cmpNum(a: number | null | undefined, b: number | null | undefined, dir: SortDir): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return dir === 'asc' ? a - b : b - a
}

// ─── Color scale ─────────────────────────────────────────────────────────────

const SCALE = [
  { min: 1,   max: 1,   fill: '#F0D8DC', textDark: true  },
  { min: 2,   max: 3,   fill: '#D9949F', textDark: false },
  { min: 4,   max: 6,   fill: '#BE5D6C', textDark: false },
  { min: 7,   max: 9,   fill: '#9C2E3D', textDark: false },
  { min: 10,  max: 12,  fill: '#7A1628', textDark: false },
  { min: 13,  max: Infinity, fill: '#57071A', textDark: false },
] as const

function getColor(count: number): string {
  if (count === 0) return 'transparent'
  for (const step of SCALE) {
    if (count <= step.max) return step.fill
  }
  return SCALE[SCALE.length - 1].fill
}

function getHoverColor(count: number): string {
  if (count === 0) return 'rgba(0,0,0,0.04)'
  const base = getColor(count)
  const hover: Record<string, string> = {
    '#F0D8DC': '#E2BAC2',
    '#D9949F': '#C9788A',
    '#BE5D6C': '#AE4558',
    '#9C2E3D': '#8C2033',
    '#7A1628': '#6A0A1E',
    '#57071A': '#47010F',
  }
  return hover[base] ?? base
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function ColorLegend() {
  const steps = [
    { label: '1',     fill: '#F0D8DC' },
    { label: '2–3',   fill: '#D9949F' },
    { label: '4–6',   fill: '#BE5D6C' },
    { label: '7–9',   fill: '#9C2E3D' },
    { label: '10–12', fill: '#7A1628' },
    { label: '13+',   fill: '#57071A' },
  ]
  return (
    <div className="flex items-center gap-1 px-4 py-2.5 border-t border-border flex-wrap">
      <span className="text-[11px] font-body text-text-tertiary mr-1">Dioceses:</span>
      {steps.map(({ label, fill }) => (
        <div key={label} className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-sm border border-black/10 flex-shrink-0"
            style={{ backgroundColor: fill }}
          />
          <span className="text-[11px] font-body text-text-tertiary">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Territories ─────────────────────────────────────────────────────────────

const TERRITORY_LIST = [
  { name: 'Puerto Rico',              abbr: 'PR'   },
  { name: 'Guam',                     abbr: 'GU'   },
  { name: 'US Virgin Islands',        abbr: 'USVI' },
  { name: 'American Samoa',           abbr: 'AS'   },
  { name: 'Northern Mariana Islands', abbr: 'CNMI' },
]
const TERRITORY_NAMES = new Set(TERRITORY_LIST.map(t => t.name))

function TerritoryChips({
  countMap,
  onChipClick,
}: {
  countMap: Map<string, number>
  onChipClick: (name: string) => void
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border flex-wrap">
      <span className="text-[11px] font-body text-text-tertiary mr-1 flex-shrink-0">Territories:</span>
      {TERRITORY_LIST.map(({ name, abbr }) => {
        const count = countMap.get(name) ?? 0
        const fill = getColor(count)
        const isDark = count >= 4
        return (
          <button
            key={name}
            onClick={() => count > 0 && onChipClick(name)}
            disabled={count === 0}
            title={`${name}: ${count} diocese${count !== 1 ? 's' : ''}`}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-body font-medium transition-colors ${
              count > 0
                ? 'cursor-pointer hover:opacity-80'
                : 'cursor-default opacity-35'
            }`}
            style={{
              backgroundColor: count > 0 ? fill : '#F5F0EB',
              borderColor: count > 0 ? 'rgba(0,0,0,0.15)' : '#DDD8D0',
              color: isDark ? '#FFFFFF' : '#4A3728',
            }}
          >
            <span>{abbr}</span>
            {count > 0 && (
              <span
                className="text-[10px] font-semibold rounded-full px-1"
                style={{ backgroundColor: 'rgba(0,0,0,0.12)' }}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── State row ────────────────────────────────────────────────────────────────

function StateRow({ d }: { d: DioceseEntry }) {
  const isVacant = !d.bishop && !d.apostolicAdmin
  const isEastern = d.riteType === 'eastern'

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
          {isVacant && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-body font-semibold tracking-wide bg-burgundy text-white flex-shrink-0">
              Vacant
            </span>
          )}
        </div>
        {isEastern && (
          <div className="flex gap-1 flex-wrap mt-0.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-body font-medium bg-tag text-text-secondary flex-shrink-0">
              Eastern Catholic
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-body font-medium bg-tag text-text-secondary flex-shrink-0">
              {d.riteName}
            </span>
          </div>
        )}
      </td>
      <td className="px-4 py-3 align-top text-sm font-body text-text-secondary">
        {bishopCell}
      </td>
      <td className="px-4 py-3 align-top text-sm font-body text-text-secondary hidden sm:table-cell">
        {d.provinceName}
      </td>
    </tr>
  )
}

// ─── Expandable section ───────────────────────────────────────────────────────

function StateSection({
  name,
  items,
  isOpen,
  onToggle,
  hasCatholicPop,
  hasTotalPop,
  hasArea,
}: {
  name: string
  items: DioceseEntry[]
  isOpen: boolean
  onToggle: () => void
  hasCatholicPop: boolean
  hasTotalPop: boolean
  hasArea: boolean
}) {
  const id = `state-${name.replace(/\W+/g, '-')}`

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
    return [...items].sort((a, b) => {
      switch (innerSort) {
        case 'dateErected': return cmpStr(a.dateErected, b.dateErected, innerDir)
        case 'catholicPop': return cmpNum(a.catholicPopulation, b.catholicPopulation, innerDir)
        case 'totalPop':    return cmpNum(a.totalPopulation, b.totalPopulation, innerDir)
        case 'area':        return cmpNum(a.area, b.area, innerDir)
        default:            return cmpStr(a.seeName, b.seeName, innerDir)
      }
    })
  }, [items, innerSort, innerDir])

  return (
    <div id={id} className="scroll-mt-24 border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-surface text-left"
        aria-expanded={isOpen}
      >
        <span className="font-display text-base font-semibold text-text-primary">{name}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-body text-text-tertiary">
            {items.length} diocese{items.length !== 1 ? 's' : ''}
          </span>
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            className={`text-text-tertiary transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}
          >
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="bg-white">
          <div className="px-4 py-2.5 border-b border-border bg-surface/50">
            <SortControl
              label="Sort:"
              options={innerSortOptions}
              value={innerSort}
              dir={innerDir}
              onSort={(key, dir) => { setInnerSort(key); setInnerDir(dir) }}
            />
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface/30 text-left text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide">
                <th className="px-4 py-2">Diocese</th>
                <th className="px-4 py-2">Bishop</th>
                <th className="px-4 py-2 hidden sm:table-cell">Province</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map(d => <StateRow key={d.id} d={d} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function USMapView({
  stateGroups,
  hasCatholicPop = false,
  hasTotalPop = false,
  hasArea = false,
}: {
  stateGroups: { name: string; items: DioceseEntry[] }[]
  hasCatholicPop?: boolean
  hasTotalPop?: boolean
  hasArea?: boolean
}) {
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [openStates, setOpenStates] = useState<Set<string>>(new Set())

  const continentalGroups = useMemo(
    () => stateGroups.filter(g => !TERRITORY_NAMES.has(g.name)),
    [stateGroups],
  )
  const territoryGroups = useMemo(
    () => stateGroups.filter(g => TERRITORY_NAMES.has(g.name)),
    [stateGroups],
  )

  const countMap = useMemo(
    () => new Map(stateGroups.map(g => [g.name, g.items.length])),
    [stateGroups],
  )

  function handleMapClick(stateName: string) {
    if ((countMap.get(stateName) ?? 0) === 0) return
    setOpenStates(prev => { const n = new Set(prev); n.add(stateName); return n })
    setTimeout(() => {
      document.getElementById(`state-${stateName.replace(/\W+/g, '-')}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  function toggleSection(name: string) {
    setOpenStates(prev => {
      const n = new Set(prev)
      if (n.has(name)) n.delete(name); else n.add(name)
      return n
    })
  }

  const hoverCount = hoveredState ? (countMap.get(hoveredState) ?? 0) : 0

  return (
    <div>
      {/* Map card */}
      <div className="rounded-xl overflow-hidden border border-border bg-white mb-4">
        <ComposableMap
          projection="geoAlbersUsa"
          width={800}
          height={480}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: GeoFeature[] }) =>
              geographies.map((geo: GeoFeature) => {
                const stateName = (geo.properties as { name: string }).name
                const count = countMap.get(stateName) ?? 0
                const fill = getColor(count)
                const hoverFill = getHoverColor(count)
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => handleMapClick(stateName)}
                    onMouseEnter={() => setHoveredState(stateName)}
                    onMouseLeave={() => setHoveredState(null)}
                    style={{
                      default: {
                        fill,
                        stroke: '#C8C0B4',
                        strokeWidth: 0.5,
                        outline: 'none',
                        cursor: count > 0 ? 'pointer' : 'default',
                      },
                      hover: {
                        fill: hoverFill,
                        stroke: '#9A8474',
                        strokeWidth: 0.75,
                        outline: 'none',
                        cursor: count > 0 ? 'pointer' : 'default',
                      },
                      pressed: {
                        fill: hoverFill,
                        stroke: '#9A8474',
                        strokeWidth: 0.75,
                        outline: 'none',
                        cursor: count > 0 ? 'pointer' : 'default',
                      },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>

        <TerritoryChips countMap={countMap} onChipClick={handleMapClick} />
        <ColorLegend />

        <div className="px-4 py-2 border-t border-border min-h-[34px] flex items-center">
          {hoveredState ? (
            <p className="text-xs font-body text-text-secondary">
              <span className="font-medium text-text-primary">{hoveredState}</span>
              {hoverCount > 0
                ? <> — {hoverCount} diocese{hoverCount !== 1 ? 's' : ''}. Click to expand.</>
                : <> — no matching dioceses</>
              }
            </p>
          ) : (
            <p className="text-xs font-body text-text-tertiary">
              Hover a state to preview · Click to expand its dioceses below
            </p>
          )}
        </div>
      </div>

      {/* Continental state sections */}
      <div className="space-y-2">
        {continentalGroups.map(({ name, items }) => (
          <StateSection
            key={name}
            name={name}
            items={items}
            isOpen={openStates.has(name)}
            onToggle={() => toggleSection(name)}
            hasCatholicPop={hasCatholicPop}
            hasTotalPop={hasTotalPop}
            hasArea={hasArea}
          />
        ))}
      </div>

      {/* Territory sections */}
      {territoryGroups.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-body font-semibold text-text-tertiary uppercase tracking-widest mb-2 px-1">
            Territories
          </p>
          <div className="space-y-2">
            {TERRITORY_LIST.map(({ name }) => {
              const group = territoryGroups.find(g => g.name === name)
              if (!group) return null
              return (
                <StateSection
                  key={name}
                  name={name}
                  items={group.items}
                  isOpen={openStates.has(name)}
                  onToggle={() => toggleSection(name)}
                  hasCatholicPop={hasCatholicPop}
                  hasTotalPop={hasTotalPop}
                  hasArea={hasArea}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
