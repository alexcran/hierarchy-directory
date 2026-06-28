'use client'
import { useState, useEffect, useRef } from 'react'

export interface EducationRecord {
  id: string | null
  institution: string
  degree: string
  fieldOfStudy: string
  startYear: string
  endYear: string
  ordinal: number
}

interface Local extends EducationRecord {
  status: 'idle' | 'saving' | 'saved' | 'error'
  error: string
}

interface Props {
  personId: string
  initial: EducationRecord[]
}

function blank(ordinal: number): Local {
  return { id: null, institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', ordinal, status: 'idle', error: '' }
}

function toLocal(r: EducationRecord): Local {
  return { ...r, status: 'idle', error: '' }
}

// ── Institution autocomplete input ───────────────────────────────────────────
function InstitutionInput({
  value, onChange, suggestions,
}: { value: string; onChange: (v: string) => void; suggestions: string[] }) {
  const [open, setOpen]       = useState(false)
  const [filtered, setFilter] = useState<string[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleChange(v: string) {
    onChange(v)
    if (v.length >= 1) {
      setFilter(suggestions.filter(s => s.toLowerCase().includes(v.toLowerCase())).slice(0, 8))
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  const ic = 'w-full px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors'

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => value.length >= 1 && filtered.length > 0 && setOpen(true)}
        placeholder="e.g. North American College"
        className={ic}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(s); setOpen(false) }}
              className="w-full text-left px-4 py-2 text-sm font-body text-text-primary hover:bg-surface transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function EducationEditor({ personId, initial }: Props) {
  const [records, setRecords]       = useState<Local[]>(initial.map(toLocal))
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/admin/education/institutions')
      .then(r => r.json())
      .then(setSuggestions)
      .catch(() => {})
  }, [])

  function update(i: number, changes: Partial<Local>) {
    setRecords(prev => prev.map((r, idx) => idx === i ? { ...r, ...changes, status: 'idle' } : r))
  }

  function setStatus(i: number, status: Local['status'], error = '') {
    setRecords(prev => prev.map((r, idx) => idx === i ? { ...r, status, error } : r))
  }

  function moveUp(i: number) {
    if (i === 0) return
    setRecords(prev => {
      const next = [...prev]
      ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
      return next.map((r, idx) => ({ ...r, ordinal: idx }))
    })
  }

  function moveDown(i: number) {
    setRecords(prev => {
      if (i >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
      return next.map((r, idx) => ({ ...r, ordinal: idx }))
    })
  }

  async function save(i: number) {
    const r = records[i]
    if (!r.institution.trim()) { setStatus(i, 'error', 'Institution is required'); return }
    setStatus(i, 'saving')
    const body = {
      personId:    personId,
      institution: r.institution.trim(),
      degree:      r.degree.trim()      || null,
      fieldOfStudy: r.fieldOfStudy.trim() || null,
      startYear:   r.startYear || null,
      endYear:     r.endYear   || null,
      ordinal:     r.ordinal,
    }
    try {
      const res = r.id
        ? await fetch(`/api/admin/education/${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/admin/education',         { method: 'POST',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      // After saving a new institution, add it to suggestions
      if (!suggestions.includes(r.institution.trim())) {
        setSuggestions(prev => [...prev, r.institution.trim()].sort())
      }
      setRecords(prev => prev.map((r2, idx) => idx === i ? { ...r2, id: data.id, status: 'saved', error: '' } : r2))
    } catch (e) {
      setStatus(i, 'error', e instanceof Error ? e.message : 'Save failed')
    }
  }

  async function remove(i: number) {
    const r = records[i]
    if (r.id) {
      setStatus(i, 'saving')
      await fetch(`/api/admin/education/${r.id}`, { method: 'DELETE' })
    }
    setRecords(prev => prev.filter((_, idx) => idx !== i).map((r2, idx) => ({ ...r2, ordinal: idx })))
  }

  const lc = 'block text-xs font-body font-semibold text-text-secondary mb-1 uppercase tracking-wide'
  const ic = 'w-full px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors'

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-body text-sm font-semibold text-text-primary">Education</h2>
        <button
          type="button"
          onClick={() => setRecords(prev => [...prev, blank(prev.length)])}
          className="text-sm font-body text-burgundy hover:underline"
        >
          + Add education
        </button>
      </div>

      {records.length === 0 && (
        <p className="px-6 py-5 text-sm font-body text-text-tertiary">No education records yet.</p>
      )}

      <div className="divide-y divide-border">
        {records.map((r, i) => (
          <div key={r.id ?? `new-${i}`} className="px-6 py-5 space-y-3">
            {/* Institution */}
            <div>
              <label className={lc}>Institution</label>
              <InstitutionInput
                value={r.institution}
                onChange={v => update(i, { institution: v })}
                suggestions={suggestions}
              />
            </div>

            {/* Degree + Field */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lc}>Degree</label>
                <input type="text" value={r.degree} onChange={e => update(i, { degree: e.target.value })} placeholder="e.g. JCD, MDiv, STD" className={ic} />
              </div>
              <div>
                <label className={lc}>Field of study</label>
                <input type="text" value={r.fieldOfStudy} onChange={e => update(i, { fieldOfStudy: e.target.value })} placeholder="e.g. Canon Law" className={ic} />
              </div>
            </div>

            {/* Years */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lc}>Start year</label>
                <input type="number" value={r.startYear} onChange={e => update(i, { startYear: e.target.value })} placeholder="e.g. 1985" className={ic} />
              </div>
              <div>
                <label className={lc}>End year</label>
                <input type="number" value={r.endYear} onChange={e => update(i, { endYear: e.target.value })} placeholder="e.g. 1989" className={ic} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap pt-1">
              <button onClick={() => save(i)} disabled={r.status === 'saving'} className="px-4 py-2 bg-burgundy text-white text-sm font-body font-semibold rounded-lg hover:bg-burgundy/90 disabled:opacity-50">
                {r.status === 'saving' ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => remove(i)} disabled={r.status === 'saving'} className="px-4 py-2 text-sm font-body text-red-600 hover:underline disabled:opacity-50">
                Delete
              </button>
              <div className="flex gap-1 ml-auto">
                <button onClick={() => moveUp(i)} disabled={i === 0} className="px-2 py-1 text-xs font-body text-text-tertiary hover:text-text-primary disabled:opacity-30 border border-border rounded" title="Move up">↑</button>
                <button onClick={() => moveDown(i)} disabled={i === records.length - 1} className="px-2 py-1 text-xs font-body text-text-tertiary hover:text-text-primary disabled:opacity-30 border border-border rounded" title="Move down">↓</button>
              </div>
              {r.status === 'saved' && <span className="text-sm font-body text-green-600">Saved</span>}
              {r.status === 'error'  && <span className="text-sm font-body text-red-600">{r.error}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
