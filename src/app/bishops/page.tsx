'use client'
import { Suspense, useState, useEffect, useCallback } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { BishopCard } from '@/components/bishop/BishopCard'
import { FilterPanel } from '@/components/filters/FilterPanel'
import { FilterChips } from '@/components/filters/FilterChips'
import { useFilters } from '@/hooks/useFilters'
import type { BishopsResult } from '@/lib/queries/bishops'
import type { ReligiousOrderOption } from '@/components/ui/ReligiousOrderCombobox'
import type { FilterOptions } from '@/components/filters/FilterPanel'
import { BishopCardSkeleton } from '@/components/ui/Skeleton'

const SORT_OPTIONS = [
  { value: 'recently_appointed', label: 'Recently Appointed' },
  { value: 'last_name', label: 'Last name' },
  { value: 'see', label: 'See' },
  { value: 'consecration_date', label: 'Consecration date' },
  { value: 'age', label: 'Age' },
]

function BishopsPageContent() {
  const { filters, setFilters, clearAll, hasActiveFilters } = useFilters()
  const [data, setData] = useState<BishopsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [religiousOrders, setReligiousOrders] = useState<ReligiousOrderOption[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ rites: [], dioceses: [], provinces: [] })

  useEffect(() => {
    fetch('/api/religious-orders')
      .then(r => r.json())
      .then(data => setReligiousOrders(data))
      .catch(() => {})
    fetch('/api/filter-options')
      .then(r => r.json())
      .then(data => setFilterOptions(data))
      .catch(() => {})
  }, [])

  const fetchBishops = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams()
      if (filters.search)                  params.set('search',               filters.search)
      if (filters.status.length)           params.set('status',               filters.status.join(','))
      else                                 params.set('status',               'all')
      if (filters.rank.length)             params.set('rank',                 filters.rank.join(','))
      if (filters.riteIds.length)          params.set('rite',                 filters.riteIds.join(','))
      if (filters.state)                   params.set('state',                filters.state)
      if (filters.dioceseId)               params.set('diocese',              filters.dioceseId)
      if (filters.provinceId)              params.set('province',             filters.provinceId)
      if (filters.religiousOrder)          params.set('religiousOrder',       filters.religiousOrder)
      if (filters.isElector)               params.set('is_elector',           '1')
      if (filters.ageMin)                  params.set('age_min',              filters.ageMin)
      if (filters.ageMax)                  params.set('age_max',              filters.ageMax)
      if (filters.appointmentPope)         params.set('pope',                 filters.appointmentPope)
      if (filters.consecratedById)         params.set('consecrated_by',       filters.consecratedById)
      if (filters.consecratedAfter)        params.set('consecrated_after',    filters.consecratedAfter)
      if (filters.consecratedBefore)       params.set('consecrated_before',   filters.consecratedBefore)
      if (filters.ordinationAfter)         params.set('ordination_after',     filters.ordinationAfter)
      if (filters.ordinationBefore)        params.set('ordination_before',    filters.ordinationBefore)
      if (filters.sort && filters.sort !== 'recently_appointed') params.set('sort', filters.sort)
      if (filters.page > 1)                params.set('page',                 String(filters.page))
      params.set('per_page', '48')

      const res = await fetch(`/api/bishops?${params}`)
      if (!res.ok) throw new Error('fetch failed')
      setData(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchBishops()
  }, [fetchBishops])

  const totalPages = data ? Math.ceil(data.total / data.perPage) : 0
  const isLivingOnly = filters.status.length === 1 && filters.status[0] === 'living'
  const isSearchMode = filters.search.trim().length > 0

  return (
    <div className="max-w-content mx-auto px-6 py-6 pb-24">
      <div className="flex gap-8">
        {/* Sidebar — hidden on mobile */}
        <aside className="hidden md:block w-60 flex-shrink-0">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-subtle pr-2 pb-6">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">Filters</p>
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              filterCounts={data?.filterCounts}
              religiousOrders={religiousOrders}
              filterOptions={filterOptions}
            />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="md:hidden flex items-center gap-1.5 px-3 py-1.5 text-sm font-body border border-border rounded-lg text-text-primary hover:bg-surface transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
              </button>
              <span className="text-sm font-body text-text-secondary">
                {loading ? (
                  <span className="inline-block w-32 h-4 bg-surface rounded animate-pulse" />
                ) : (
                  <>
                    Showing{' '}
                    <span className="font-semibold text-text-primary">
                      {data?.total ?? 0}
                    </span>{' '}
                    {isSearchMode
                      ? (data?.total ?? 0) === 1 ? `result for "${filters.search.trim()}"` : `results for "${filters.search.trim()}"`
                      : isLivingOnly
                      ? (data?.total ?? 0) === 1 ? 'living bishop' : 'living bishops'
                      : (data?.total ?? 0) === 1 ? 'bishop' : 'bishops'}
                  </>
                )}
              </span>
            </div>

            <select
              value={filters.sort}
              onChange={e => setFilters({ sort: e.target.value })}
              className="text-sm font-body text-text-primary bg-white border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <FilterChips filters={filters} setFilters={setFilters} clearAll={clearAll} religiousOrders={religiousOrders} filterOptions={filterOptions} />
          )}

          {/* Error state */}
          {error && (
            <div className="py-12 text-center">
              <p className="font-body text-text-secondary">Failed to load bishops.</p>
              <button
                onClick={fetchBishops}
                className="mt-3 text-sm font-body text-burgundy hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Grid */}
          {!error && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {loading
                ? Array.from({ length: 20 }).map((_, i) => <BishopCardSkeleton key={i} />)
                : data?.bishops.map((bishop, i) => (
                    <BishopCard
                      key={bishop.id}
                      bishop={bishop}
                      priority={i < 10}
                      showStatus={isSearchMode}
                    />
                  ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && data?.bishops.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-display text-xl text-text-secondary mb-2">No bishops found</p>
              <p className="font-body text-sm text-text-tertiary mb-4">
                Try adjusting or clearing your filters.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="text-sm font-body text-burgundy hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                onClick={() => setFilters({ page: filters.page - 1 })}
                disabled={filters.page <= 1}
                className="px-4 py-2 text-sm font-body border border-border rounded-lg text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-body text-text-secondary px-2">
                Page {filters.page} of {totalPages}
              </span>
              <button
                onClick={() => setFilters({ page: filters.page + 1 })}
                disabled={filters.page >= totalPages}
                className="px-4 py-2 text-sm font-body border border-border rounded-lg text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-display font-semibold text-text-primary">Filters</span>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 text-text-secondary hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterPanel
                filters={filters}
                setFilters={(f) => { setFilters(f); setMobileFiltersOpen(false) }}
                filterCounts={data?.filterCounts}
                onClose={() => setMobileFiltersOpen(false)}
                religiousOrders={religiousOrders}
                filterOptions={filterOptions}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function BishopsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-content mx-auto px-6 py-6">
          <div className="flex gap-8">
            <div className="hidden md:block w-60 flex-shrink-0">
              <div className="h-64 bg-surface rounded-lg animate-pulse" />
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {Array.from({ length: 15 }).map((_, i) => (
                <BishopCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <BishopsPageContent />
    </Suspense>
  )
}
