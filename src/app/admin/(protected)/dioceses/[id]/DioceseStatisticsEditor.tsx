'use client'
import { useState } from 'react'

export interface StatRecord {
  id: string
  year: number
  catholicPopulation: number | null
  totalPopulation:    number | null
  numParishes:        number | null
  numPriests:         number | null
  numDeacons:         number | null
  numReligious:       number | null
  source:             string | null
}

interface LocalStat extends StatRecord {
  isEditing: boolean
  draft: {
    year:               string
    catholicPopulation: string
    totalPopulation:    string
    numParishes:        string
    numPriests:         string
    numDeacons:         string
    numReligious:       string
    source:             string
  }
  status: 'idle' | 'saving' | 'saved' | 'error'
  error: string
}

function toLocal(s: StatRecord): LocalStat {
  return {
    ...s,
    isEditing: false,
    draft: {
      year:               String(s.year),
      catholicPopulation: s.catholicPopulation != null ? String(s.catholicPopulation) : '',
      totalPopulation:    s.totalPopulation    != null ? String(s.totalPopulation)    : '',
      numParishes:        s.numParishes        != null ? String(s.numParishes)        : '',
      numPriests:         s.numPriests         != null ? String(s.numPriests)         : '',
      numDeacons:         s.numDeacons         != null ? String(s.numDeacons)         : '',
      numReligious:       s.numReligious       != null ? String(s.numReligious)       : '',
      source:             s.source             ?? '',
    },
    status: 'idle', error: '',
  }
}

function blankLocal(): LocalStat {
  const year = new Date().getFullYear()
  return {
    id: '', year, catholicPopulation: null, totalPopulation: null,
    numParishes: null, numPriests: null, numDeacons: null, numReligious: null, source: null,
    isEditing: true,
    draft: { year: String(year), catholicPopulation: '', totalPopulation: '', numParishes: '', numPriests: '', numDeacons: '', numReligious: '', source: '' },
    status: 'idle', error: '',
  }
}

const ic = 'w-full px-2 py-1.5 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-burgundy/30 focus:border-burgundy transition-colors'

export function DioceseStatisticsEditor({
  seeId,
  initial,
}: {
  seeId: string
  initial: StatRecord[]
}) {
  const [stats, setStats] = useState<LocalStat[]>(
    [...initial].sort((a, b) => b.year - a.year).map(toLocal),
  )

  function update(i: number, changes: Partial<LocalStat['draft']>) {
    setStats(prev => prev.map((s, idx) =>
      idx === i ? { ...s, draft: { ...s.draft, ...changes }, status: 'idle' } : s,
    ))
  }

  function setStatus(i: number, status: LocalStat['status'], error = '') {
    setStats(prev => prev.map((s, idx) => idx === i ? { ...s, status, error } : s))
  }

  async function save(i: number) {
    const s = stats[i]
    if (!s.draft.year) { setStatus(i, 'error', 'Year is required'); return }
    setStatus(i, 'saving')
    try {
      const body = {
        seeId,
        year:               s.draft.year,
        catholicPopulation: s.draft.catholicPopulation || null,
        totalPopulation:    s.draft.totalPopulation    || null,
        numParishes:        s.draft.numParishes        || null,
        numPriests:         s.draft.numPriests         || null,
        numDeacons:         s.draft.numDeacons         || null,
        numReligious:       s.draft.numReligious       || null,
        source:             s.draft.source             || null,
      }
      const res = s.id
        ? await fetch(`/api/admin/diocese-statistics/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/admin/diocese-statistics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setStats(prev => prev.map((s2, idx) =>
        idx === i
          ? {
              ...s2,
              id:                 data.id,
              year:               Number(s.draft.year),
              catholicPopulation: s.draft.catholicPopulation ? Number(s.draft.catholicPopulation) : null,
              totalPopulation:    s.draft.totalPopulation    ? Number(s.draft.totalPopulation)    : null,
              numParishes:        s.draft.numParishes        ? Number(s.draft.numParishes)        : null,
              numPriests:         s.draft.numPriests         ? Number(s.draft.numPriests)         : null,
              numDeacons:         s.draft.numDeacons         ? Number(s.draft.numDeacons)         : null,
              numReligious:       s.draft.numReligious       ? Number(s.draft.numReligious)       : null,
              source:             s.draft.source             || null,
              isEditing: false, status: 'saved', error: '',
            }
          : s2,
      ))
    } catch (e) {
      setStatus(i, 'error', e instanceof Error ? e.message : 'Save failed')
    }
  }

  async function remove(i: number) {
    const s = stats[i]
    if (s.id) {
      setStatus(i, 'saving')
      await fetch(`/api/admin/diocese-statistics/${s.id}`, { method: 'DELETE' })
    }
    setStats(prev => prev.filter((_, idx) => idx !== i))
  }

  const NUM_COLS: { key: keyof LocalStat['draft']; label: string }[] = [
    { key: 'catholicPopulation', label: 'Catholic Pop.' },
    { key: 'totalPopulation',    label: 'Total Pop.'    },
    { key: 'numParishes',        label: 'Parishes'      },
    { key: 'numPriests',         label: 'Priests'       },
    { key: 'numDeacons',         label: 'Deacons'       },
    { key: 'numReligious',       label: 'Religious'     },
  ]

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-body text-sm font-semibold text-text-primary">Statistics</h2>
        <button
          type="button"
          onClick={() => setStats(prev => [blankLocal(), ...prev])}
          className="text-sm font-body text-burgundy hover:underline"
        >
          + Add year
        </button>
      </div>

      {stats.length === 0 && (
        <p className="px-6 py-5 text-sm font-body text-text-tertiary">No statistics recorded.</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">
              <th className="px-4 py-2.5">Year</th>
              {NUM_COLS.map(c => <th key={c.key} className="px-3 py-2.5">{c.label}</th>)}
              <th className="px-3 py-2.5">Source</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stats.map((s, i) => (
              <tr key={s.id || `new-${i}`} className={s.isEditing ? 'bg-surface/40' : 'hover:bg-surface/30'}>
                {s.isEditing ? (
                  <>
                    <td className="px-4 py-2">
                      <input type="number" min="1800" max="2100" value={s.draft.year} onChange={e => update(i, { year: e.target.value })} className={ic} style={{ width: 72 }} />
                    </td>
                    {NUM_COLS.map(c => (
                      <td key={c.key} className="px-3 py-2">
                        <input type="number" min="0" value={s.draft[c.key]} onChange={e => update(i, { [c.key]: e.target.value })} className={ic} style={{ width: 90 }} />
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <input type="text" value={s.draft.source} onChange={e => update(i, { source: e.target.value })} placeholder="Source…" className={ic} style={{ minWidth: 120 }} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => save(i)} disabled={s.status === 'saving'} className="px-3 py-1 bg-burgundy text-white text-xs font-body font-semibold rounded hover:bg-burgundy/90 disabled:opacity-50">
                          {s.status === 'saving' ? '…' : 'Save'}
                        </button>
                        {s.id && (
                          <button onClick={() => setStats(prev => prev.map((s2, idx) => idx === i ? { ...s2, isEditing: false } : s2))} className="text-xs font-body text-text-secondary hover:text-text-primary">Cancel</button>
                        )}
                        <button onClick={() => remove(i)} disabled={s.status === 'saving'} className="text-xs font-body text-red-600 hover:underline">Del</button>
                        {s.status === 'error' && <span className="text-xs text-red-600">{s.error}</span>}
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 font-semibold">{s.year}</td>
                    {NUM_COLS.map(c => (
                      <td key={c.key} className="px-3 py-2 text-text-secondary tabular-nums">
                        {(s[c.key as keyof StatRecord] as number | null)?.toLocaleString() ?? '—'}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-text-tertiary text-xs max-w-[140px] truncate">{s.source ?? '—'}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => setStats(prev => prev.map((s2, idx) => idx === i ? { ...s2, isEditing: true } : s2))} className="text-xs font-body text-text-tertiary hover:text-text-primary">Edit</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
