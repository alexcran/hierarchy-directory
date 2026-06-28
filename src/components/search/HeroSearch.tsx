'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { BishopPortrait } from '@/components/bishop/BishopPortrait'
import type { TypeaheadResult } from '@/lib/queries/search'

export function HeroSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TypeaheadResult | null>(null)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null)
      setOpen(false)
      return
    }
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then((data: TypeaheadResult) => {
        setResults(data)
        const has = data.bishops.length > 0 || data.dioceses.length > 0
        setOpen(has)
      })
      .catch(() => {})
  }, [debouncedQuery])

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      setOpen(false)
      router.push(`/bishops?search=${encodeURIComponent(query.trim())}`)
    }
  }

  function navigate(path: string) {
    setOpen(false)
    setQuery('')
    router.push(path)
  }

  const hasResults = results && (results.bishops.length > 0 || results.dioceses.length > 0)

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex shadow-sm">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            placeholder="Search bishops, dioceses, or locations…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => hasResults && setOpen(true)}
            onKeyDown={e => e.key === 'Escape' && setOpen(false)}
            className="w-full h-12 pl-12 pr-4 text-base font-body bg-white border border-r-0 border-border rounded-l-xl placeholder:text-text-tertiary text-text-primary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
          />
        </div>
        <button
          type="submit"
          className="h-12 px-6 text-sm font-body font-semibold text-white bg-burgundy hover:bg-burgundy-hover rounded-r-xl transition-colors flex-shrink-0"
        >
          Search
        </button>
      </form>

      {open && hasResults && results && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {results.bishops.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide bg-surface/60">
                Bishops
              </div>
              {results.bishops.map(b => (
                <button
                  key={b.id}
                  onMouseDown={() => navigate(`/bishops/${b.slug}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface text-left transition-colors"
                >
                  <BishopPortrait
                    src={b.portraitUrl}
                    name={b.name}
                    width={32}
                    height={32}
                    rankColor={b.isCardinal ? '#C41E3A' : '#007A00'}
                    barHeight={4}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-body text-text-primary truncate">{b.name}</div>
                    {b.title && <div className="text-xs text-text-tertiary truncate">{b.title}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
          {results.dioceses.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide bg-surface/60">
                Dioceses
              </div>
              {results.dioceses.map(d => (
                <button
                  key={d.id}
                  onMouseDown={() => navigate(`/dioceses/${d.slug}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-body text-text-primary truncate">{d.name}</div>
                    {d.country && <div className="text-xs text-text-tertiary truncate">{d.country}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
