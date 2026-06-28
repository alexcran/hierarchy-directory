'use client'
import { useState, useRef, useEffect, useId } from 'react'
import { ChevronDown, X } from 'lucide-react'

export interface ReligiousOrderOption {
  id: string
  fullName: string
  abbreviation: string
  commonName: string | null
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: ReligiousOrderOption[]
  includeDiocesanOption?: boolean
  placeholder?: string
  className?: string
}

function normalize(s: string) {
  return s.toLowerCase().replace(/\./g, '')
}

function matchesQuery(opt: ReligiousOrderOption, q: string): boolean {
  const n = normalize(q)
  return (
    opt.fullName.toLowerCase().includes(q.toLowerCase()) ||
    normalize(opt.abbreviation).includes(n) ||
    (opt.commonName?.toLowerCase().includes(q.toLowerCase()) ?? false)
  )
}

function getLabel(value: string, options: ReligiousOrderOption[]): string {
  if (value === 'diocesan') return 'Diocesan clergy (no order)'
  if (!value) return ''
  const opt = options.find(o => o.id === value)
  return opt ? `${opt.fullName} (${opt.abbreviation})` : ''
}

export function ReligiousOrderCombobox({
  value,
  onChange,
  options,
  includeDiocesanOption = false,
  placeholder = 'Search by name or abbreviation…',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const filtered = query ? options.filter(o => matchesQuery(o, query)) : options
  const displayValue = open ? query : getLabel(value, options)

  function select(id: string) {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`flex items-center w-full px-3 py-2 text-sm font-body border rounded-lg bg-white text-text-primary cursor-text transition-colors ${
          open
            ? 'ring-2 ring-burgundy/30 border-burgundy'
            : 'border-border hover:border-text-secondary'
        }`}
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
      >
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={displayValue}
          placeholder={value ? '' : placeholder}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-text-tertiary"
        />
        {value ? (
          <button
            type="button"
            onClick={clear}
            className="flex-shrink-0 ml-1 text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown
            className={`flex-shrink-0 ml-1 w-4 h-4 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-border rounded-lg shadow-lg"
        >
          {includeDiocesanOption && (
            <li
              role="option"
              aria-selected={value === 'diocesan'}
              onClick={() => select('diocesan')}
              className={`px-3 py-2 text-sm font-body cursor-pointer select-none hover:bg-surface transition-colors ${
                value === 'diocesan' ? 'bg-surface font-medium text-burgundy' : 'text-text-primary'
              }`}
            >
              Diocesan clergy (no order)
            </li>
          )}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm font-body text-text-tertiary">No results</li>
          )}
          {filtered.map(opt => (
            <li
              key={opt.id}
              role="option"
              aria-selected={value === opt.id}
              onClick={() => select(opt.id)}
              className={`px-3 py-2 text-sm font-body cursor-pointer select-none hover:bg-surface transition-colors ${
                value === opt.id ? 'bg-surface font-medium text-burgundy' : 'text-text-primary'
              }`}
            >
              <span className="font-medium">{opt.abbreviation}</span>
              <span className="text-text-secondary"> — {opt.fullName}</span>
              {opt.commonName && (
                <span className="text-text-tertiary"> ({opt.commonName})</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
