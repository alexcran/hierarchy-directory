'use client'
import { X } from 'lucide-react'
import type { Filters } from '@/hooks/useFilters'
import type { ReligiousOrderOption } from '@/components/ui/ReligiousOrderCombobox'
import type { FilterOptions } from '@/components/filters/FilterPanel'
import { formatSeeName } from '@/lib/utils/formatSeeName'

const STATUS_LABELS: Record<string, string> = {
  living:              'Living',
  active:              'Active Ministry',
  resignation_pending: 'Resignation Pending',
  retired:             'Retired / Emeritus',
  deceased:            'Deceased',
}

const RANK_LABELS: Record<string, string> = {
  cardinal:   'Cardinal',
  archbishop: 'Archbishop',
  bishop:     'Bishop',
}

interface FilterChipsProps {
  filters: Filters
  setFilters: (f: Partial<Filters>) => void
  clearAll: () => void
  religiousOrders?: ReligiousOrderOption[]
  filterOptions?: FilterOptions
}

interface Chip {
  key: string
  label: string
  onRemove: () => void
}

export function FilterChips({
  filters,
  setFilters,
  clearAll,
  religiousOrders = [],
  filterOptions = { rites: [], dioceses: [], provinces: [] },
}: FilterChipsProps) {
  const chips: Chip[] = []

  if (filters.search) {
    chips.push({ key: 'search', label: `"${filters.search}"`, onRemove: () => setFilters({ search: '' }) })
  }
  for (const s of filters.status) {
    chips.push({
      key: `status-${s}`,
      label: STATUS_LABELS[s] ?? s,
      onRemove: () => setFilters({ status: filters.status.filter(x => x !== s) }),
    })
  }
  for (const r of filters.rank) {
    chips.push({
      key: `rank-${r}`,
      label: RANK_LABELS[r] ?? r,
      onRemove: () => setFilters({ rank: filters.rank.filter(x => x !== r) }),
    })
  }
  if (filters.isElector) {
    chips.push({ key: 'elector', label: 'Elector (under 80)', onRemove: () => setFilters({ isElector: false }) })
  }
  if (filters.state) {
    chips.push({ key: 'state', label: filters.state, onRemove: () => setFilters({ state: '' }) })
  }
  if (filters.dioceseId) {
    const d = filterOptions.dioceses.find(x => x.id === filters.dioceseId)
    const label = d ? formatSeeName(d.name, d.seeType, d.namePrefixOverride) : 'Diocese'
    chips.push({ key: 'diocese', label, onRemove: () => setFilters({ dioceseId: '' }) })
  }
  if (filters.provinceId) {
    const p = filterOptions.provinces.find(x => x.id === filters.provinceId)
    const label = p ? `Province of ${p.name}` : 'Province'
    chips.push({ key: 'province', label, onRemove: () => setFilters({ provinceId: '' }) })
  }
  for (const riteId of filters.riteIds) {
    const rite = filterOptions.rites.find(r => r.id === riteId)
    if (rite) {
      chips.push({
        key: `rite-${riteId}`,
        label: rite.name,
        onRemove: () => setFilters({ riteIds: filters.riteIds.filter(id => id !== riteId) }),
      })
    }
  }
  if (filters.religiousOrder) {
    let orderLabel: string
    if (filters.religiousOrder === 'diocesan') {
      orderLabel = 'Diocesan clergy'
    } else {
      const opt = religiousOrders.find(o => o.id === filters.religiousOrder)
      orderLabel = opt ? opt.fullName : 'Order'
    }
    chips.push({ key: 'order', label: orderLabel, onRemove: () => setFilters({ religiousOrder: '' }) })
  }
  if (filters.ageMin || filters.ageMax) {
    const label = filters.ageMin && filters.ageMax
      ? `Age ${filters.ageMin}–${filters.ageMax}`
      : filters.ageMin
        ? `Age ${filters.ageMin}+`
        : `Under ${Number(filters.ageMax) + 1}`
    chips.push({ key: 'age', label, onRemove: () => setFilters({ ageMin: '', ageMax: '' }) })
  }
  if (filters.appointmentPope) {
    chips.push({ key: 'pope', label: `Appointed by ${filters.appointmentPope}`, onRemove: () => setFilters({ appointmentPope: '' }) })
  }
  if (filters.consecratedById) {
    chips.push({
      key: 'consec-by',
      label: `Consecrated by ${filters.consecratedByName || 'bishop'}`,
      onRemove: () => setFilters({ consecratedById: '', consecratedByName: '' }),
    })
  }
  if (filters.consecratedAfter || filters.consecratedBefore) {
    const label = filters.consecratedAfter && filters.consecratedBefore
      ? `Consecrated ${filters.consecratedAfter}–${filters.consecratedBefore}`
      : filters.consecratedAfter
        ? `Consecrated after ${filters.consecratedAfter}`
        : `Consecrated before ${filters.consecratedBefore}`
    chips.push({ key: 'consec', label, onRemove: () => setFilters({ consecratedAfter: '', consecratedBefore: '' }) })
  }
  if (filters.ordinationAfter || filters.ordinationBefore) {
    const label = filters.ordinationAfter && filters.ordinationBefore
      ? `Ordained ${filters.ordinationAfter}–${filters.ordinationBefore}`
      : filters.ordinationAfter
        ? `Ordained after ${filters.ordinationAfter}`
        : `Ordained before ${filters.ordinationBefore}`
    chips.push({ key: 'ordination', label, onRemove: () => setFilters({ ordinationAfter: '', ordinationBefore: '' }) })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {chips.map(chip => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-tag rounded-full text-xs font-body text-text-primary"
        >
          {chip.label}
          <button
            onClick={chip.onRemove}
            aria-label={`Remove ${chip.label} filter`}
            className="text-text-tertiary hover:text-text-primary transition-colors ml-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button
          onClick={clearAll}
          className="text-xs font-body text-text-secondary hover:text-burgundy transition-colors underline underline-offset-2"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
