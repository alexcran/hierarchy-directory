'use client'

export type SortDir = 'asc' | 'desc'

export interface SortOption {
  key: string
  label: string
}

// Keys that default to descending (largest-first) when first activated
const DESC_DEFAULT = new Set(['catholicPop', 'totalPop', 'area', 'count'])

export function defaultSortDir(key: string): SortDir {
  return DESC_DEFAULT.has(key) ? 'desc' : 'asc'
}

export function SortControl({
  options,
  value,
  dir,
  onSort,
  label = 'Sort by:',
  className = '',
}: {
  options: SortOption[]
  value: string
  dir: SortDir
  onSort: (key: string, dir: SortDir) => void
  label?: string
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <span className="text-xs font-body text-text-tertiary flex-shrink-0">{label}</span>
      {options.map(opt => {
        const active = value === opt.key
        return (
          <button
            key={opt.key}
            onClick={() =>
              active
                ? onSort(opt.key, dir === 'asc' ? 'desc' : 'asc')
                : onSort(opt.key, defaultSortDir(opt.key))
            }
            className={`flex items-center gap-1 text-xs font-body px-3 py-1.5 rounded-md border transition-colors ${
              active
                ? 'bg-burgundy text-white border-burgundy'
                : 'bg-white text-text-secondary border-border hover:text-text-primary'
            }`}
          >
            {opt.label}
            {active && (
              <svg width="8" height="10" viewBox="0 0 8 10" fill="none" className="flex-shrink-0">
                {dir === 'asc'
                  ? <path d="M4 1l3 5H1l3-5z" fill="currentColor" />
                  : <path d="M4 9L1 4h6L4 9z" fill="currentColor" />
                }
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}
