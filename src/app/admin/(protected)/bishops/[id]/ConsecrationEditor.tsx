'use client'
import { useState } from 'react'
import { PersonPicker } from '@/components/admin/PersonPicker'

export interface ConsecrationData {
  id: string | null
  date: string
  location: string
  principalConsecratorId: string | null
  principalConsecratorName: string | null
  coConsecrators: { id: string; name: string }[]
}

interface Props { personId: string; initial: ConsecrationData | null }

type Status = 'idle' | 'saving' | 'saved' | 'error'

export function ConsecrationEditor({ personId, initial }: Props) {
  const [fields, setFields] = useState<ConsecrationData>(
    initial ?? { id: null, date: '', location: '', principalConsecratorId: null, principalConsecratorName: null, coConsecrators: [] }
  )
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function set<K extends keyof ConsecrationData>(key: K, value: ConsecrationData[K]) {
    setFields(prev => ({ ...prev, [key]: value }))
    if (status === 'saved') setStatus('idle')
  }

  function addCoConsecrator() {
    set('coConsecrators', [...fields.coConsecrators, { id: '', name: '' }])
  }

  function updateCoConsecrator(i: number, v: { id: string; name: string } | null) {
    const next = fields.coConsecrators.map((c, idx) =>
      idx === i ? (v ?? { id: '', name: '' }) : c
    )
    set('coConsecrators', next)
  }

  function removeCoConsecrator(i: number) {
    set('coConsecrators', fields.coConsecrators.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    if (!fields.date) { setErrorMsg('Date is required'); setStatus('error'); return }
    setStatus('saving'); setErrorMsg('')

    const body = {
      date:                   fields.date,
      location:               fields.location || null,
      principalConsecratorId: fields.principalConsecratorId,
      coConsecrators:         fields.coConsecrators.filter(c => c.id).map(c => c.id),
    }

    try {
      let id = fields.id
      if (!id) {
        const res = await fetch('/api/admin/consecrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personId, ...body }),
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        id = data.id
        setFields(prev => ({ ...prev, id }))
      } else {
        const res = await fetch(`/api/admin/consecrations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(await res.text())
      }
      setStatus('saved')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Save failed')
      setStatus('error')
    }
  }

  const lc = 'block text-xs font-body font-semibold text-text-secondary mb-1.5 uppercase tracking-wide'
  const ic = 'w-full px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors'
  const excludeIds = [personId, ...(fields.principalConsecratorId ? [fields.principalConsecratorId] : []), ...fields.coConsecrators.filter(c => c.id).map(c => c.id)]

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-body text-sm font-semibold text-text-primary">Episcopal Consecration</h2>
      </div>
      <div className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lc}>Date</label>
            <input type="date" value={fields.date} onChange={e => set('date', e.target.value)} className={ic} />
          </div>
          <div>
            <label className={lc}>Location</label>
            <input type="text" value={fields.location} onChange={e => set('location', e.target.value)} placeholder="Church, City" className={ic} />
          </div>
        </div>

        <div>
          <label className={lc}>Principal consecrator</label>
          <PersonPicker
            value={fields.principalConsecratorId ? { id: fields.principalConsecratorId, name: fields.principalConsecratorName ?? '' } : null}
            onChange={v => { set('principalConsecratorId', v?.id ?? null); set('principalConsecratorName', v?.name ?? null) }}
            placeholder="Search for principal consecrator…"
            excludeIds={[personId, ...fields.coConsecrators.filter(c => c.id).map(c => c.id)]}
          />
        </div>

        {/* Co-consecrators */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={lc + ' mb-0'}>Co-consecrators</label>
            <button type="button" onClick={addCoConsecrator} className="text-xs font-body text-burgundy hover:underline">+ Add</button>
          </div>
          <div className="space-y-2">
            {fields.coConsecrators.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <PersonPicker
                    value={c.id ? c : null}
                    onChange={v => updateCoConsecrator(i, v)}
                    placeholder="Search for co-consecrator…"
                    excludeIds={excludeIds.filter(id => id !== c.id)}
                  />
                </div>
                <button type="button" onClick={() => removeCoConsecrator(i)} className="text-text-tertiary hover:text-red-600 text-lg leading-none flex-shrink-0">×</button>
              </div>
            ))}
            {fields.coConsecrators.length === 0 && (
              <p className="text-sm font-body text-text-tertiary">None added.</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-1">
          <button onClick={handleSave} disabled={status === 'saving'} className="px-4 py-2 bg-burgundy text-white text-sm font-body font-semibold rounded-lg hover:bg-burgundy/90 disabled:opacity-50">
            {status === 'saving' ? 'Saving…' : 'Save'}
          </button>
          {status === 'saved' && <span className="text-sm font-body text-green-600">Saved</span>}
          {status === 'error' && <span className="text-sm font-body text-red-600">{errorMsg || 'Error'}</span>}
        </div>
      </div>
    </div>
  )
}
