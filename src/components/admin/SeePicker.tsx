'use client'
import { useState, useRef, useEffect } from 'react'

interface See { id: string; name: string }

interface Props {
  value: See | null
  onChange: (v: See | null) => void
  placeholder?: string
  allowCreate?: boolean
}

const SEE_TYPES = [
  'diocese',
  'archdiocese',
  'eparchy',
  'archeparchy',
  'apostolic_exarchate',
  'apostolic_vicariate',
  'military_ordinariate',
  'personal_ordinariate',
  'territorial_prelature',
  'titular_see',
]

const RITES = ['Latin', 'Maronite', 'Melkite', 'Ukrainian', 'Ruthenian', 'Romanian', 'Chaldean', 'Armenian', 'Syro-Malabar', 'Syriac']

const inputClass = 'w-full px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors'
const labelClass = 'block text-xs font-body font-semibold text-text-secondary mb-1 uppercase tracking-wide'

export function SeePicker({ value, onChange, placeholder = 'Search for a diocese...', allowCreate = false }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<See[]>([])
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createStatus, setCreateStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [error, setError] = useState('')
  const [createFields, setCreateFields] = useState({
    name: '',
    seeType: 'diocese',
    riteName: 'Latin',
    countryName: '',
    countryIsoCode: '',
    stateRegion: '',
  })
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function search(q: string) {
    if (q.length < 2) {
      setResults([])
      return
    }
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setResults(data.dioceses as Array<{ id: string; name: string }>)
  }

  function handleInput(q: string) {
    setQuery(q)
    setCreateFields(prev => ({ ...prev, name: q }))
    setCreating(false)
    setError('')
    setOpen(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => search(q), 250)
  }

  function setCreateField(key: keyof typeof createFields, v: string) {
    setCreateFields(prev => ({ ...prev, [key]: v }))
    setCreateStatus('idle')
    setError('')
  }

  async function createSee() {
    if (!createFields.name.trim()) {
      setCreateStatus('error')
      setError('Name is required')
      return
    }
    setCreateStatus('saving')
    setError('')
    try {
      const res = await fetch('/api/admin/sees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createFields),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Create failed')
      onChange({ id: data.id, name: data.name })
      setQuery('')
      setResults([])
      setOpen(false)
      setCreating(false)
      setCreateStatus('idle')
    } catch (err) {
      setCreateStatus('error')
      setError(err instanceof Error ? err.message : 'Create failed')
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-white text-sm font-body">
        <span className="flex-1 text-text-primary truncate">{value.name}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-text-tertiary hover:text-text-primary text-base leading-none flex-shrink-0"
        >
          x
        </button>
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
        className={inputClass}
      />
      {open && (results.length > 0 || query.length >= 2 || creating) && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
          {!creating && (
            <>
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
              {results.length === 0 && query.length >= 2 && (
                <div className="px-4 py-2 text-sm font-body text-text-tertiary">No matching See selected.</div>
              )}
              {allowCreate && query.trim().length >= 2 && (
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => setCreating(true)}
                  className="w-full text-left px-4 py-2 text-sm font-body font-semibold text-burgundy hover:bg-surface border-t border-border"
                >
                  Create &quot;{query.trim()}&quot;
                </button>
              )}
            </>
          )}
          {creating && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelClass}>Place name</label>
                  <input type="text" value={createFields.name} onChange={e => setCreateField('name', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>See type</label>
                  <select value={createFields.seeType} onChange={e => setCreateField('seeType', e.target.value)} className={inputClass}>
                    {SEE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Rite</label>
                  <select value={createFields.riteName} onChange={e => setCreateField('riteName', e.target.value)} className={inputClass}>
                    {RITES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input type="text" value={createFields.countryName} onChange={e => setCreateField('countryName', e.target.value)} placeholder="e.g. Jamaica" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>ISO</label>
                  <input type="text" value={createFields.countryIsoCode} onChange={e => setCreateField('countryIsoCode', e.target.value.toUpperCase())} placeholder="JM" maxLength={3} className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>State / region</label>
                  <input type="text" value={createFields.stateRegion} onChange={e => setCreateField('stateRegion', e.target.value)} placeholder="Optional" className={inputClass} />
                </div>
              </div>
              {createStatus === 'error' && <p className="text-sm font-body text-red-600">{error}</p>}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={createSee}
                  disabled={createStatus === 'saving'}
                  className="px-3 py-2 bg-burgundy text-white text-sm font-body font-semibold rounded-lg disabled:opacity-50"
                >
                  {createStatus === 'saving' ? 'Creating...' : 'Create See'}
                </button>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => setCreating(false)}
                  className="px-3 py-2 text-sm font-body text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
