'use client'
import { useState, useRef, useEffect } from 'react'

interface Person { id: string; name: string }

interface Props {
  value: Person | null
  onChange: (v: Person | null) => void
  placeholder?: string
  excludeIds?: string[]
}

export function PersonPicker({ value, onChange, placeholder = 'Search for a person…', excludeIds = [] }: Props) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<Person[]>([])
  const [open, setOpen]       = useState(false)
  const timer   = useRef<ReturnType<typeof setTimeout>>()
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function search(q: string) {
    if (q.length < 2) { setResults([]); return }
    const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setResults(
      (data.bishops as Array<{ id: string; name: string }>)
        .filter(b => !excludeIds.includes(b.id))
    )
  }

  function handleInput(q: string) {
    setQuery(q)
    setOpen(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => search(q), 250)
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-white text-sm font-body">
        <span className="flex-1 text-text-primary truncate">{value.name}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-text-tertiary hover:text-text-primary text-base leading-none flex-shrink-0"
        >×</button>
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => handleInput(e.target.value)}
        onFocus={() => query.length >= 2 && setOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors"
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
          {results.map(r => (
            <button
              key={r.id}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(r); setQuery(''); setResults([]); setOpen(false) }}
              className="w-full text-left px-4 py-2 text-sm font-body text-text-primary hover:bg-surface transition-colors"
            >
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
