'use client'
import { useState, useRef, useEffect } from 'react'
import { SeePicker } from '@/components/admin/SeePicker'

const SEE_TYPES = ['diocese', 'archdiocese', 'eparchy', 'archeparchy', 'apostolic_exarchate', 'personal_ordinariate']

interface FormData {
  name: string
  latinName: string
  seeType: string
  namePrefixOverride: string
  stateRegion: string
  isMetropolitan: boolean
  metropolitanSeeId: string | null
  metropolitanSeeName: string | null
  countryId: string | null
  riteId: string
  dateErected: string
  dateSuppressed: string
  cathedralName: string
  coCathedralName: string
  cathedralAddress: string
}

interface CountryOption { id: string; name: string; isoCode: string }
interface RiteOption    { id: string; name: string; type: string }

interface Props {
  seeId: string
  initial: FormData
  countries: CountryOption[]
  rites: RiteOption[]
}

type Status = 'idle' | 'saving' | 'saved' | 'error'

const lc = 'block text-xs font-body font-semibold text-text-secondary mb-1.5 uppercase tracking-wide'
const ic = 'w-full px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors'

function CountryPicker({
  countries,
  value,
  onChange,
}: {
  countries: CountryOption[]
  value: string | null
  onChange: (id: string | null) => void
}) {
  const selected = countries.find(c => c.id === value) ?? null
  const [query, setQuery]   = useState('')
  const [open, setOpen]     = useState(false)
  const containerRef        = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = query.trim()
    ? countries.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.isoCode.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : countries.slice(0, 10)

  if (selected && !open) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-white">
        <span className="text-sm font-body text-text-primary flex-1">{selected.name}</span>
        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => { onChange(null); setQuery('') }}
          className="text-text-tertiary hover:text-text-primary text-lg leading-none"
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        placeholder={selected ? selected.name : 'Search countries…'}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        className={ic}
      />
      {open && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-border rounded-lg shadow-lg max-h-56 overflow-y-auto">
          <li>
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(null); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm font-body text-text-tertiary hover:bg-surface"
            >
              — No country
            </button>
          </li>
          {filtered.map(c => (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { onChange(c.id); setQuery(''); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-sm font-body text-text-primary hover:bg-surface flex items-center justify-between"
              >
                <span>{c.name}</span>
                <span className="text-xs text-text-tertiary font-mono">{c.isoCode}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm font-body text-text-tertiary">No matches</li>
          )}
        </ul>
      )}
    </div>
  )
}

export function DioceseEditForm({ seeId, initial, countries, rites }: Props) {
  const [fields, setFields] = useState<FormData>(initial)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFields(prev => ({ ...prev, [key]: value }))
    if (status === 'saved') setStatus('idle')
  }

  async function handleSave() {
    setStatus('saving'); setErrorMsg('')
    const res = await fetch(`/api/admin/sees/${seeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:               fields.name,
        latinName:          fields.latinName       || null,
        seeType:            fields.seeType,
        namePrefixOverride: fields.namePrefixOverride || null,
        stateRegion:        fields.stateRegion        || null,
        isMetropolitan:     fields.isMetropolitan,
        metropolitanSeeId:  fields.metropolitanSeeId  || null,
        countryId:          fields.countryId          || null,
        riteId:             fields.riteId,
        dateErected:        fields.dateErected         || null,
        dateSuppressed:     fields.dateSuppressed      || null,
        cathedralName:      fields.cathedralName       || null,
        coCathedralName:    fields.coCathedralName     || null,
        cathedralAddress:   fields.cathedralAddress    || null,
      }),
    })
    if (res.ok) { setStatus('saved') }
    else { setErrorMsg('Save failed'); setStatus('error') }
  }

  return (
    <div className="space-y-6">
      {/* Identity */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-body text-sm font-semibold text-text-primary">Identity</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Place name</label>
              <input type="text" value={fields.name} onChange={e => set('name', e.target.value)} placeholder="e.g. New York" className={ic} />
            </div>
            <div>
              <label className={lc}>See type</label>
              <select value={fields.seeType} onChange={e => set('seeType', e.target.value)} className={ic}>
                {SEE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lc}>Latin name</label>
            <input type="text" value={fields.latinName} onChange={e => set('latinName', e.target.value)} placeholder="e.g. Archidioecesis Chicagiensis" className={ic} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Country</label>
              <CountryPicker
                countries={countries}
                value={fields.countryId}
                onChange={v => set('countryId', v)}
              />
            </div>
            <div>
              <label className={lc}>Rite</label>
              <select value={fields.riteId} onChange={e => set('riteId', e.target.value)} className={ic}>
                {rites.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Name prefix override</label>
              <input type="text" value={fields.namePrefixOverride} onChange={e => set('namePrefixOverride', e.target.value)} placeholder="Overrides computed prefix" className={ic} />
            </div>
            <div>
              <label className={lc}>State / region</label>
              <input type="text" value={fields.stateRegion} onChange={e => set('stateRegion', e.target.value)} placeholder="e.g. New York" className={ic} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Date erected</label>
              <input type="date" value={fields.dateErected} onChange={e => set('dateErected', e.target.value)} className={ic} />
            </div>
            <div>
              <label className={lc}>Date suppressed</label>
              <input type="date" value={fields.dateSuppressed} onChange={e => set('dateSuppressed', e.target.value)} className={ic} />
            </div>
          </div>
        </div>
      </div>

      {/* Province */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-body text-sm font-semibold text-text-primary">Province</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={fields.isMetropolitan} onChange={e => set('isMetropolitan', e.target.checked)} />
              <div className={`w-9 h-5 rounded-full transition-colors ${fields.isMetropolitan ? 'bg-burgundy' : 'bg-border'}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${fields.isMetropolitan ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-sm font-body text-text-secondary">This is a metropolitan see</span>
          </label>

          {!fields.isMetropolitan && (
            <div>
              <label className={lc}>Metropolitan see (province)</label>
              <SeePicker
                value={fields.metropolitanSeeId ? { id: fields.metropolitanSeeId, name: fields.metropolitanSeeName ?? '' } : null}
                onChange={v => { set('metropolitanSeeId', v?.id ?? null); set('metropolitanSeeName', v?.name ?? null) }}
                placeholder="Search for metropolitan see…"
              />
            </div>
          )}
        </div>
      </div>

      {/* Cathedral */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-body text-sm font-semibold text-text-primary">Cathedral</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Cathedral name</label>
              <input type="text" value={fields.cathedralName} onChange={e => set('cathedralName', e.target.value)} placeholder="e.g. St. Patrick's Cathedral" className={ic} />
            </div>
            <div>
              <label className={lc}>Co-cathedral name</label>
              <input type="text" value={fields.coCathedralName} onChange={e => set('coCathedralName', e.target.value)} placeholder="If applicable" className={ic} />
            </div>
          </div>
          <div>
            <label className={lc}>Cathedral address</label>
            <input type="text" value={fields.cathedralAddress} onChange={e => set('cathedralAddress', e.target.value)} placeholder="Street, City, State ZIP" className={ic} />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={status === 'saving'} className="px-5 py-2.5 bg-burgundy text-white text-sm font-body font-semibold rounded-lg hover:bg-burgundy/90 transition-colors disabled:opacity-50">
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
        {status === 'saved' && <span className="text-sm font-body text-green-600">Saved</span>}
        {status === 'error'  && <span className="text-sm font-body text-red-600">{errorMsg}</span>}
      </div>
    </div>
  )
}
