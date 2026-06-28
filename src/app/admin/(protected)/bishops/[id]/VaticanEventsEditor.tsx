'use client'
import { useState } from 'react'

const EVENT_TYPES = [
  { value: 'ad_limina',  label: 'Ad Limina' },
  { value: 'conclave',   label: 'Conclave' },
  { value: 'consistory', label: 'Consistory' },
  { value: 'synod',      label: 'Synod' },
  { value: 'council',    label: 'Council' },
]

export interface VaticanEventRecord {
  id: string
  eventType: string
  eventDate: string
  eventEndDate: string | null
  description: string | null
}

interface LocalEvent extends VaticanEventRecord {
  isEditing: boolean
  draft: {
    eventType: string
    eventDate: string
    eventEndDate: string
    description: string
  }
  status: 'idle' | 'saving' | 'saved' | 'error'
  error: string
}

function toLocal(e: VaticanEventRecord): LocalEvent {
  return {
    ...e,
    isEditing: false,
    draft: {
      eventType:   e.eventType,
      eventDate:   e.eventDate,
      eventEndDate: e.eventEndDate ?? '',
      description: e.description ?? '',
    },
    status: 'idle',
    error: '',
  }
}

function blankLocal(): LocalEvent {
  return {
    id: '', eventType: 'ad_limina', eventDate: '', eventEndDate: null, description: null,
    isEditing: true,
    draft: { eventType: 'ad_limina', eventDate: '', eventEndDate: '', description: '' },
    status: 'idle', error: '',
  }
}

const lc = 'block text-xs font-body font-semibold text-text-secondary mb-1 uppercase tracking-wide'
const ic = 'w-full px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors'
const sc = ic

function typeLabel(t: string) {
  return EVENT_TYPES.find(e => e.value === t)?.label ?? t
}

export function VaticanEventsEditor({
  personId,
  initial,
}: {
  personId: string
  initial: VaticanEventRecord[]
}) {
  const [events, setEvents] = useState<LocalEvent[]>(initial.map(toLocal))

  function update(i: number, changes: Partial<LocalEvent['draft']>) {
    setEvents(prev => prev.map((e, idx) =>
      idx === i ? { ...e, draft: { ...e.draft, ...changes }, status: 'idle' } : e,
    ))
  }

  function setStatus(i: number, status: LocalEvent['status'], error = '') {
    setEvents(prev => prev.map((e, idx) => idx === i ? { ...e, status, error } : e))
  }

  async function save(i: number) {
    const ev = events[i]
    if (!ev.draft.eventDate) { setStatus(i, 'error', 'Event date is required'); return }
    setStatus(i, 'saving')
    try {
      const body = {
        personId,
        eventType:   ev.draft.eventType,
        eventDate:   ev.draft.eventDate,
        eventEndDate: ev.draft.eventEndDate || null,
        description: ev.draft.description  || null,
      }
      const res = ev.id
        ? await fetch(`/api/admin/vatican-events/${ev.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/admin/vatican-events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setEvents(prev => prev.map((e2, idx) =>
        idx === i
          ? {
              ...e2,
              id:          data.id,
              eventType:   ev.draft.eventType,
              eventDate:   ev.draft.eventDate,
              eventEndDate: ev.draft.eventEndDate || null,
              description: ev.draft.description  || null,
              isEditing: false, status: 'saved', error: '',
            }
          : e2,
      ))
    } catch (e) {
      setStatus(i, 'error', e instanceof Error ? e.message : 'Save failed')
    }
  }

  async function remove(i: number) {
    const ev = events[i]
    if (ev.id) {
      setStatus(i, 'saving')
      await fetch(`/api/admin/vatican-events/${ev.id}`, { method: 'DELETE' })
    }
    setEvents(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-body text-sm font-semibold text-text-primary">Vatican Events</h2>
        <button
          type="button"
          onClick={() => setEvents(prev => [blankLocal(), ...prev])}
          className="text-sm font-body text-burgundy hover:underline"
        >
          + Add event
        </button>
      </div>

      {events.length === 0 && (
        <p className="px-6 py-5 text-sm font-body text-text-tertiary">No Vatican events recorded.</p>
      )}

      <div className="divide-y divide-border">
        {events.map((ev, i) => (
          <div key={ev.id || `new-${i}`} className="px-6 py-4">
            {ev.isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lc}>Event type</label>
                    <select value={ev.draft.eventType} onChange={e => update(i, { eventType: e.target.value })} className={sc}>
                      {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lc}>Event date</label>
                    <input type="date" value={ev.draft.eventDate} onChange={e => update(i, { eventDate: e.target.value })} className={ic} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lc}>End date <span className="font-normal normal-case text-text-tertiary">(multi-day events)</span></label>
                    <input type="date" value={ev.draft.eventEndDate} onChange={e => update(i, { eventEndDate: e.target.value })} className={ic} />
                  </div>
                  <div>
                    <label className={lc}>Description</label>
                    <input type="text" value={ev.draft.description} onChange={e => update(i, { description: e.target.value })} placeholder="e.g. Conclave — 2013" className={ic} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => save(i)} disabled={ev.status === 'saving'} className="px-4 py-2 bg-burgundy text-white text-sm font-body font-semibold rounded-lg hover:bg-burgundy/90 disabled:opacity-50">
                    {ev.status === 'saving' ? 'Saving…' : 'Save'}
                  </button>
                  {ev.id && (
                    <button onClick={() => setEvents(prev => prev.map((e2, idx) => idx === i ? { ...e2, isEditing: false } : e2))} className="text-sm font-body text-text-secondary hover:text-text-primary">
                      Cancel
                    </button>
                  )}
                  <button onClick={() => remove(i)} disabled={ev.status === 'saving'} className="text-sm font-body text-red-600 hover:underline disabled:opacity-50">
                    Delete
                  </button>
                  {ev.status === 'error' && <span className="text-sm font-body text-red-600">{ev.error}</span>}
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-body font-medium text-text-primary">
                    {typeLabel(ev.eventType)}
                    {ev.eventDate && (
                      <span className="ml-2 text-text-tertiary font-normal">
                        {new Date(ev.eventDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {ev.eventEndDate && ` – ${new Date(ev.eventEndDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                      </span>
                    )}
                  </p>
                  {ev.description && (
                    <p className="text-xs font-body text-text-secondary mt-0.5">{ev.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setEvents(prev => prev.map((e2, idx) => idx === i ? { ...e2, isEditing: true } : e2))}
                  className="flex-shrink-0 text-xs font-body text-text-tertiary hover:text-text-primary transition-colors"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
