'use client'
import { useState, useRef, useEffect, useId } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { FilterGroup } from './FilterGroup'
import type { Filters } from '@/hooks/useFilters'
import type { FilterCounts } from '@/lib/queries/bishops'
import { ReligiousOrderCombobox, type ReligiousOrderOption } from '@/components/ui/ReligiousOrderCombobox'
import { formatSeeName } from '@/lib/utils/formatSeeName'
import { useDebounce } from '@/hooks/useDebounce'
import type { TypeaheadResult } from '@/lib/queries/search'

export interface FilterOptions {
  rites: { id: string; name: string; type: string }[]
  dioceses: { id: string; name: string; seeType: string; namePrefixOverride: string | null; stateRegion: string | null }[]
  provinces: { id: string; name: string; seeType: string; namePrefixOverride: string | null; stateRegion: string | null }[]
}

interface FilterPanelProps {
  filters: Filters
  setFilters: (f: Partial<Filters>) => void
  filterCounts?: FilterCounts
  onClose?: () => void
  religiousOrders?: ReligiousOrderOption[]
  filterOptions?: FilterOptions
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function CheckboxOption({
  label,
  checked,
  count,
  onChange,
}: {
  label: string
  checked: boolean
  count?: number
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group/opt py-0.5">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" />
      <span
        className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
          checked ? 'bg-burgundy border-burgundy' : 'border-border group-hover/opt:border-text-secondary'
        }`}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className="flex-1 text-sm font-body text-text-primary">{label}</span>
      {count !== undefined && (
        <span className="text-xs font-body text-text-tertiary tabular-nums">{count.toLocaleString()}</span>
      )}
    </label>
  )
}

function toggle(arr: string[], val: string, on: boolean): string[] {
  return on ? [...arr.filter(v => v !== val), val] : arr.filter(v => v !== val)
}

const INPUT_CLS = 'w-full h-8 px-2 text-sm font-body text-text-primary bg-white border border-border rounded-md placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-burgundy/40 focus:border-burgundy [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

function YearRangeInputs({
  fromValue, toValue, onFrom, onTo, fromPlaceholder, toPlaceholder,
}: {
  fromValue: string; toValue: string
  onFrom: (v: string) => void; onTo: (v: string) => void
  fromPlaceholder?: string; toPlaceholder?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <input type="number" min="1700" max="2100" placeholder={fromPlaceholder ?? 'From'} value={fromValue} onChange={e => onFrom(e.target.value)} className={INPUT_CLS} />
      <span className="text-text-tertiary text-xs flex-shrink-0">–</span>
      <input type="number" min="1700" max="2100" placeholder={toPlaceholder ?? 'To'} value={toValue} onChange={e => onTo(e.target.value)} className={INPUT_CLS} />
    </div>
  )
}

// ─── Age filter ───────────────────────────────────────────────────────────────

const AGE_PRESETS = [
  { label: 'Under 50', ageMin: '',   ageMax: '49' },
  { label: '50–60',    ageMin: '50', ageMax: '60' },
  { label: '61–69',    ageMin: '61', ageMax: '69' },
  { label: '70–74',    ageMin: '70', ageMax: '74' },
  { label: '75+',      ageMin: '75', ageMax: '' },
  { label: '80+',      ageMin: '80', ageMax: '' },
]

function AgeFilter({ ageMin, ageMax, setFilters }: {
  ageMin: string; ageMax: string; setFilters: (f: Partial<Filters>) => void
}) {
  const activePreset = AGE_PRESETS.find(p => p.ageMin === ageMin && p.ageMax === ageMax)

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {AGE_PRESETS.map(p => {
          const active = p === activePreset
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => setFilters(active ? { ageMin: '', ageMax: '' } : { ageMin: p.ageMin, ageMax: p.ageMax })}
              className={`px-2.5 py-1 text-xs font-body rounded-full border transition-colors ${
                active
                  ? 'bg-burgundy text-white border-burgundy'
                  : 'border-border text-text-primary hover:border-burgundy hover:text-burgundy'
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>
      {!activePreset && (
        <div>
          <label className="block text-xs font-body text-text-secondary mb-1">Custom range</label>
          <div className="flex items-center gap-2">
            <input type="number" min="18" max="120" placeholder="From age" value={ageMin} onChange={e => setFilters({ ageMin: e.target.value })} className={INPUT_CLS} />
            <span className="text-text-tertiary text-xs flex-shrink-0">–</span>
            <input type="number" min="18" max="120" placeholder="To age" value={ageMax} onChange={e => setFilters({ ageMax: e.target.value })} className={INPUT_CLS} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Rite filter ──────────────────────────────────────────────────────────────

function RiteFilter({ riteIds, setFilters, rites }: {
  riteIds: string[]
  setFilters: (f: Partial<Filters>) => void
  rites: FilterOptions['rites']
}) {
  const [easternOpen, setEasternOpen] = useState(false)
  const latinRites = rites.filter(r => r.type === 'latin')
  const easternRites = rites.filter(r => r.type === 'eastern')
  const anyEasternSelected = easternRites.some(r => riteIds.includes(r.id))

  function toggleRite(id: string, on: boolean) {
    setFilters({ riteIds: on ? [...riteIds.filter(r => r !== id), id] : riteIds.filter(r => r !== id) })
  }

  return (
    <div className="space-y-1">
      {latinRites.map(r => (
        <CheckboxOption key={r.id} label={r.name} checked={riteIds.includes(r.id)} onChange={on => toggleRite(r.id, on)} />
      ))}
      <div>
        <button
          type="button"
          onClick={() => setEasternOpen(o => !o)}
          className="w-full flex items-center justify-between py-0.5 cursor-pointer"
        >
          <span className="text-sm font-body text-text-primary">Eastern rites</span>
          <div className="flex items-center gap-1.5">
            {anyEasternSelected && <span className="w-1.5 h-1.5 rounded-full bg-burgundy" />}
            <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform ${easternOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {easternOpen && (
          <div className="ml-3 mt-1 space-y-1">
            {easternRites.map(r => (
              <CheckboxOption key={r.id} label={r.name} checked={riteIds.includes(r.id)} onChange={on => toggleRite(r.id, on)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Simple searchable dropdown ───────────────────────────────────────────────

function SearchableDropdown({ value, onChange, options, placeholder }: {
  value: string
  onChange: (id: string) => void
  options: { id: string; label: string }[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => { if (!open) setQuery('') }, [open])
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options
  const selectedLabel = options.find(o => o.id === value)?.label ?? ''

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center w-full px-3 py-2 text-sm font-body border rounded-lg bg-white text-text-primary cursor-text transition-colors ${
          open ? 'ring-2 ring-burgundy/30 border-burgundy' : 'border-border hover:border-text-secondary'
        }`}
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
      >
        <input
          ref={inputRef}
          id={listId}
          value={open ? query : selectedLabel}
          placeholder={value ? '' : (placeholder ?? 'Search…')}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-text-tertiary"
        />
        {value ? (
          <button type="button" onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }}
            className="flex-shrink-0 ml-1 text-text-tertiary hover:text-text-primary transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown className={`flex-shrink-0 ml-1 w-4 h-4 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </div>
      {open && (
        <ul className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-border rounded-lg shadow-lg">
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm font-body text-text-tertiary">No results</li>
          )}
          {filtered.map(opt => (
            <li key={opt.id}
              onClick={() => { onChange(opt.id); setOpen(false); setQuery('') }}
              className={`px-3 py-2 text-sm font-body cursor-pointer select-none hover:bg-surface transition-colors ${
                value === opt.id ? 'bg-surface font-medium text-burgundy' : 'text-text-primary'
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Person picker (for "Consecrated By") ────────────────────────────────────

function PersonPicker({ value, valueLabel, onChange, placeholder }: {
  value: string
  valueLabel: string
  onChange: (id: string, name: string) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<TypeaheadResult['bishops']>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); setOpen(false); return }
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then((data: TypeaheadResult) => { setResults(data.bishops); setOpen(data.bishops.length > 0) })
      .catch(() => {})
  }, [debouncedQuery])

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  if (value) {
    return (
      <div className="flex items-center gap-1 px-3 py-2 bg-white border border-border rounded-lg text-sm font-body text-text-primary">
        <span className="flex-1 truncate">{valueLabel}</span>
        <button type="button" onClick={() => onChange('', '')}
          className="flex-shrink-0 text-text-tertiary hover:text-text-primary transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        placeholder={placeholder ?? 'Search by name…'}
        onChange={e => setQuery(e.target.value)}
        className="w-full h-9 px-3 text-sm font-body text-text-primary bg-white border border-border rounded-lg placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-border rounded-lg shadow-lg">
          {results.map(p => (
            <li key={p.id}
              onMouseDown={() => { onChange(p.id, p.name); setQuery(''); setOpen(false) }}
              className="px-3 py-2 cursor-pointer hover:bg-surface"
            >
              <div className="text-sm font-body text-text-primary">{p.name}</div>
              {p.title && <div className="text-xs font-body text-text-tertiary">{p.title}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Research filters collapsible section ────────────────────────────────────

function ResearchFiltersSection({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-border mt-1 pt-1">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 text-xs font-body font-semibold text-text-secondary uppercase tracking-wide"
      >
        Research Filters
        <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

function BishopPageSearch({ value, setFilters }: {
  value: string
  setFilters: (f: Partial<Filters>) => void
}) {
  const [localValue, setLocalValue] = useState(value)
  const debouncedValue = useDebounce(localValue, 500)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    if (debouncedValue !== value) setFilters({ search: debouncedValue })
  }, [debouncedValue, value, setFilters])

  return (
    <div className="relative mb-4">
      <input
        type="search"
        value={localValue}
        placeholder="Search bishops..."
        onChange={e => setLocalValue(e.target.value)}
        className="w-full h-9 px-3 text-sm font-body text-text-primary bg-white border border-border rounded-lg placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
      />
    </div>
  )
}

// ─── Main FilterPanel ─────────────────────────────────────────────────────────

export function FilterPanel({
  filters,
  setFilters,
  filterCounts,
  onClose,
  religiousOrders = [],
  filterOptions = { rites: [], dioceses: [], provinces: [] },
}: FilterPanelProps) {
  const dioceseOptions = filterOptions.dioceses.map(d => ({
    id: d.id,
    label: formatSeeName(d.name, d.seeType, d.namePrefixOverride) + (d.stateRegion ? ` (${d.stateRegion})` : ''),
  }))

  const provinceOptions = filterOptions.provinces.map(p => ({
    id: p.id,
    label: formatSeeName(p.name, p.seeType, p.namePrefixOverride) + (p.stateRegion ? ` — ${p.stateRegion}` : ''),
  }))

  return (
    <div className="font-body">
      {onClose && (
        <div className="flex items-center justify-between pb-3 mb-1 border-b border-border">
          <span className="text-sm font-semibold text-text-primary">Filters</span>
          <button onClick={onClose} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Done
          </button>
        </div>
      )}

      <BishopPageSearch value={filters.search} setFilters={setFilters} />

      {/* Status */}
      <FilterGroup label="Status">
        <CheckboxOption
          label="Living"
          checked={filters.status.includes('living')}
          count={filterCounts?.status.living}
          onChange={on => setFilters({ status: toggle(filters.status, 'living', on) })}
        />
        <CheckboxOption
          label="Active Ministry"
          checked={filters.status.includes('active')}
          count={filterCounts?.status.active}
          onChange={on => setFilters({ status: toggle(filters.status, 'active', on) })}
        />
        <CheckboxOption
          label="Resignation Pending"
          checked={filters.status.includes('resignation_pending')}
          count={filterCounts?.status.resignation_pending}
          onChange={on => setFilters({ status: toggle(filters.status, 'resignation_pending', on) })}
        />
        <CheckboxOption
          label="Retired / Emeritus"
          checked={filters.status.includes('retired')}
          count={filterCounts?.status.retired}
          onChange={on => setFilters({ status: toggle(filters.status, 'retired', on) })}
        />
        <CheckboxOption
          label="Deceased"
          checked={filters.status.includes('deceased')}
          count={filterCounts?.status.deceased}
          onChange={on => setFilters({ status: toggle(filters.status, 'deceased', on) })}
        />
      </FilterGroup>

      {/* Rank */}
      <FilterGroup label="Rank">
        <CheckboxOption
          label="Cardinal"
          checked={filters.rank.includes('cardinal')}
          count={filterCounts?.rank.cardinal}
          onChange={on => setFilters({ rank: toggle(filters.rank, 'cardinal', on) })}
        />
        <CheckboxOption
          label="Archbishop"
          checked={filters.rank.includes('archbishop')}
          count={filterCounts?.rank.archbishop}
          onChange={on => setFilters({ rank: toggle(filters.rank, 'archbishop', on) })}
        />
        <CheckboxOption
          label="Bishop"
          checked={filters.rank.includes('bishop')}
          count={filterCounts?.rank.bishop}
          onChange={on => setFilters({ rank: toggle(filters.rank, 'bishop', on) })}
        />
      </FilterGroup>

      {/* Cardinal Status */}
      <FilterGroup label="Cardinal Status" defaultOpen={false}>
        <CheckboxOption
          label="Is a Cardinal"
          checked={filters.rank.includes('cardinal')}
          onChange={on => setFilters({ rank: toggle(filters.rank, 'cardinal', on) })}
        />
        <CheckboxOption
          label="Is an Elector (under 80)"
          checked={filters.isElector}
          onChange={on => setFilters({ isElector: on })}
        />
      </FilterGroup>

      {/* Age */}
      <FilterGroup label="Age" defaultOpen={false}>
        <AgeFilter ageMin={filters.ageMin} ageMax={filters.ageMax} setFilters={setFilters} />
      </FilterGroup>

      {/* Location */}
      <FilterGroup label="State / Region" defaultOpen={false}>
        <input
          type="text"
          value={filters.state}
          placeholder="e.g. Maryland"
          onChange={e => setFilters({ state: e.target.value })}
          className="w-full h-8 px-3 text-sm font-body text-text-primary bg-white border border-border rounded-md placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-burgundy/40 focus:border-burgundy"
        />
      </FilterGroup>

      {/* Rite */}
      {filterOptions.rites.length > 0 && (
        <FilterGroup label="Rite" defaultOpen={false}>
          <RiteFilter riteIds={filters.riteIds} setFilters={setFilters} rites={filterOptions.rites} />
        </FilterGroup>
      )}

      {/* Diocese */}
      {filterOptions.dioceses.length > 0 && (
        <FilterGroup label="Diocese" defaultOpen={false}>
          <SearchableDropdown
            value={filters.dioceseId}
            onChange={id => setFilters({ dioceseId: id })}
            options={dioceseOptions}
            placeholder="Search dioceses…"
          />
        </FilterGroup>
      )}

      {/* Province */}
      {filterOptions.provinces.length > 0 && (
        <FilterGroup label="Province" defaultOpen={false}>
          <SearchableDropdown
            value={filters.provinceId}
            onChange={id => setFilters({ provinceId: id })}
            options={provinceOptions}
            placeholder="Search provinces…"
          />
        </FilterGroup>
      )}

      {/* Religious Order */}
      <FilterGroup label="Religious Order" defaultOpen={false}>
        <ReligiousOrderCombobox
          value={filters.religiousOrder}
          onChange={v => setFilters({ religiousOrder: v })}
          options={religiousOrders}
          includeDiocesanOption
          placeholder="Search orders…"
        />
      </FilterGroup>

      {/* Research Filters */}
      <ResearchFiltersSection>
        {/* Appointment Pope */}
        <FilterGroup label="Appointment Pope" defaultOpen={false}>
          <select
            value={filters.appointmentPope}
            onChange={e => setFilters({ appointmentPope: e.target.value })}
            className="w-full h-8 px-2 text-sm font-body text-text-primary bg-white border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy/40 focus:border-burgundy"
          >
            <option value="">Any pope</option>
            <option value="Francis">Francis</option>
            <option value="Benedict XVI">Benedict XVI</option>
            <option value="John Paul II">John Paul II</option>
            <option value="John Paul I">John Paul I</option>
            <option value="Paul VI">Paul VI</option>
            <option value="John XXIII">John XXIII</option>
          </select>
        </FilterGroup>

        {/* Consecrated By */}
        <FilterGroup label="Consecrated By" defaultOpen={false}>
          <PersonPicker
            value={filters.consecratedById}
            valueLabel={filters.consecratedByName}
            onChange={(id, name) => setFilters({ consecratedById: id, consecratedByName: name })}
            placeholder="Search bishops…"
          />
        </FilterGroup>

        {/* Episcopal Consecration Year */}
        <FilterGroup label="Consecration Year" defaultOpen={false}>
          <label className="block text-xs font-body text-text-secondary mb-1.5">Year range</label>
          <YearRangeInputs
            fromValue={filters.consecratedAfter}
            toValue={filters.consecratedBefore}
            fromPlaceholder="From year"
            toPlaceholder="To year"
            onFrom={v => setFilters({ consecratedAfter: v })}
            onTo={v => setFilters({ consecratedBefore: v })}
          />
        </FilterGroup>

        {/* Ordination Year */}
        <FilterGroup label="Ordination Year" defaultOpen={false}>
          <label className="block text-xs font-body text-text-secondary mb-1.5">Year range</label>
          <YearRangeInputs
            fromValue={filters.ordinationAfter}
            toValue={filters.ordinationBefore}
            fromPlaceholder="From year"
            toPlaceholder="To year"
            onFrom={v => setFilters({ ordinationAfter: v })}
            onTo={v => setFilters({ ordinationBefore: v })}
          />
        </FilterGroup>
      </ResearchFiltersSection>
    </div>
  )
}
