'use client'
import { useState } from 'react'
import { PersonPicker } from '@/components/admin/PersonPicker'
import { SeePicker } from '@/components/admin/SeePicker'

export interface OrdinationData {
  id?: string
  date: string
  location: string
  ordainingBishopId: string | null
  ordainingBishopName: string | null
  incardinationSeeId: string | null
  incardinationSeeName: string | null
  ordinationSeeId: string | null
  ordinationSeeName: string | null
  religiousInstituteAtOrdination: string | null
}

interface Props { personId: string; initial: OrdinationData | null }

type Status = 'idle' | 'saving' | 'saved' | 'error'

export function OrdinationEditor({ personId, initial }: Props) {
  const [fields, setFields] = useState<OrdinationData>(
    initial ?? {
      date: '', location: '',
      ordainingBishopId: null, ordainingBishopName: null,
      incardinationSeeId: null, incardinationSeeName: null,
      ordinationSeeId: null, ordinationSeeName: null,
      religiousInstituteAtOrdination: null,
    }
  )
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function set<K extends keyof OrdinationData>(key: K, value: OrdinationData[K]) {
    setFields(prev => ({ ...prev, [key]: value }))
    if (status === 'saved') setStatus('idle')
  }

  async function handleSave() {
    if (!fields.date) { setErrorMsg('Date is required'); setStatus('error'); return }
    setStatus('saving'); setErrorMsg('')
    const res = await fetch(`/api/admin/ordinations/${personId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: fields.date,
        location: fields.location || null,
        ordainingBishopId: fields.ordainingBishopId,
        incardinationSeeId: fields.incardinationSeeId,
        ordinationSeeId: fields.ordinationSeeId,
        religiousInstituteAtOrdination: fields.religiousInstituteAtOrdination || null,
      }),
    })
    if (res.ok) { setStatus('saved') }
    else { setErrorMsg('Save failed'); setStatus('error') }
  }

  const lc = 'block text-xs font-body font-semibold text-text-secondary mb-1.5 uppercase tracking-wide'
  const ic = 'w-full px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors'

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-body text-sm font-semibold text-text-primary">Priesthood Ordination</h2>
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
          <label className={lc}>Ordaining bishop</label>
          <PersonPicker
            value={fields.ordainingBishopId ? { id: fields.ordainingBishopId, name: fields.ordainingBishopName ?? '' } : null}
            onChange={v => { set('ordainingBishopId', v?.id ?? null); set('ordainingBishopName', v?.name ?? null) }}
            placeholder="Search for ordaining bishop…"
            excludeIds={[personId]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lc}>Incardinated for</label>
            <SeePicker
              value={fields.incardinationSeeId ? { id: fields.incardinationSeeId, name: fields.incardinationSeeName ?? '' } : null}
              onChange={v => { set('incardinationSeeId', v?.id ?? null); set('incardinationSeeName', v?.name ?? null) }}
              placeholder="Search for diocese…"
            />
          </div>
          <div>
            <label className={lc}>Ordination see</label>
            <SeePicker
              value={fields.ordinationSeeId ? { id: fields.ordinationSeeId, name: fields.ordinationSeeName ?? '' } : null}
              onChange={v => { set('ordinationSeeId', v?.id ?? null); set('ordinationSeeName', v?.name ?? null) }}
              placeholder="Diocese of ordination ceremony…"
            />
          </div>
        </div>

        <div>
          <label className={lc}>Religious institute</label>
          <input
            type="text"
            value={fields.religiousInstituteAtOrdination ?? ''}
            onChange={e => set('religiousInstituteAtOrdination', e.target.value || null)}
            placeholder="e.g. Order of Friars Minor Capuchin"
            className={ic}
          />
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
