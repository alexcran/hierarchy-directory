'use client'
import { useState } from 'react'
import { SeePicker } from '@/components/admin/SeePicker'
import { convertElectRole, isElectRole } from '@/lib/utils/roles'

const ROLES = [
  'ordinary', 'diocesan_bishop', 'archbishop', 'auxiliary', 'coadjutor',
  'bishop_elect', 'archbishop_elect', 'auxiliary_bishop_elect',
  'apostolic_administrator',
  'curial_president', 'curial_member', 'papal_legate', 'vicar_general', 'archpriest',
  'archbishop_emeritus', 'bishop_emeritus', 'auxiliary_emeritus', 'coadjutor_emeritus',
]
const START_REASONS = ['appointed', 'succeeded', 'elected', 'transferred', 'retired', 'other']
const END_REASONS   = ['retired', 'died', 'transferred', 'resigned', 'removed', 'succeeded', 'other']

interface AssignmentData {
  id: string | null
  seeId: string
  seeName: string
  role: string
  titleOverride: string
  startDate: string
  installedDate: string
  endDate: string
  startReason: string
  endReason: string
  isCurrent: boolean
}

interface LocalAssignment extends AssignmentData {
  isEndingMode: boolean
  endDateDraft: string
  endReasonDraft: string
  status: 'idle' | 'saving' | 'saved' | 'error'
  error: string
}

interface EmeritusPrompt {
  seeId: string
  seeName: string
  role: string
  startDate: string
  startReason: string
  status: 'idle' | 'saving' | 'error'
  error: string
}

function blank(personId: string): LocalAssignment {
  void personId
  return {
    id: null, seeId: '', seeName: '', role: 'ordinary', titleOverride: '',
    startDate: '', installedDate: '', endDate: '', startReason: 'appointed', endReason: '', isCurrent: true,
    isEndingMode: false, endDateDraft: '', endReasonDraft: 'retired',
    status: 'idle', error: '',
  }
}

export interface AssignmentRow {
  id: string
  seeId: string
  seeName: string
  role: string
  titleOverride: string | null
  startDate: string
  installedDate: string | null
  endDate: string | null
  startReason: string
  endReason: string | null
  isCurrent: boolean
}

function toLocal(a: AssignmentRow): LocalAssignment {
  return {
    id: a.id, seeId: a.seeId, seeName: a.seeName, role: a.role,
    titleOverride: a.titleOverride ?? '', startDate: a.startDate,
    installedDate: a.installedDate ?? '', endDate: a.endDate ?? '',
    startReason: a.startReason, endReason: a.endReason ?? '',
    isCurrent: a.isCurrent, isEndingMode: false, endDateDraft: '', endReasonDraft: 'retired',
    status: 'idle', error: '',
  }
}

function toEmeritusRole(role: string): string | null {
  if (role === 'auxiliary') return 'auxiliary_emeritus'
  if (role === 'coadjutor') return 'coadjutor_emeritus'
  if (role === 'ordinary' || role === 'diocesan_bishop') return 'bishop_emeritus'
  return null
}

interface Props { personId: string; initial: AssignmentRow[] }

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-body font-semibold text-text-secondary mb-1 uppercase tracking-wide">{children}</label>
}

function selectClass() {
  return 'w-full px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors'
}
function inputClass() {
  return 'w-full px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors'
}

export function AssignmentsEditor({ personId, initial }: Props) {
  const [assignments, setAssignments] = useState<LocalAssignment[]>(initial.map(toLocal))
  const [emeritusPrompt, setEmeritusPrompt] = useState<EmeritusPrompt | null>(null)

  function update(i: number, changes: Partial<LocalAssignment>) {
    setAssignments(prev => prev.map((a, idx) => idx === i ? { ...a, ...changes, status: 'idle' } : a))
  }

  function setStatus(i: number, status: LocalAssignment['status'], error = '') {
    setAssignments(prev => prev.map((a, idx) => idx === i ? { ...a, status, error } : a))
  }

  async function save(i: number) {
    const a = assignments[i]
    if (!a.seeId || !a.startDate) { setStatus(i, 'error', 'See and start date are required'); return }
    setStatus(i, 'saving')
    const body = {
      personId, seeId: a.seeId, role: a.role,
      titleOverride: a.titleOverride || null, startDate: a.startDate,
      installedDate: a.installedDate || null,
      endDate: a.endDate || null, startReason: a.startReason,
      endReason: a.endReason || null, isCurrent: a.isCurrent,
    }
    try {
      const res = a.id
        ? await fetch(`/api/admin/assignments/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/admin/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setAssignments(prev => prev.map((a2, idx) => idx === i ? { ...a2, id: data.id, status: 'saved', error: '' } : a2))
    } catch (e) {
      setStatus(i, 'error', e instanceof Error ? e.message : 'Save failed')
    }
  }

  async function remove(i: number) {
    const a = assignments[i]
    if (a.id) {
      setStatus(i, 'saving')
      await fetch(`/api/admin/assignments/${a.id}`, { method: 'DELETE' })
    }
    setAssignments(prev => prev.filter((_, idx) => idx !== i))
  }

  async function markOrdainedInstalled(i: number) {
    const a = assignments[i]
    if (!a.id) { setStatus(i, 'error', 'Save this assignment before converting it'); return }
    const installedDate = window.prompt('Ordination/installation date (YYYY-MM-DD)', a.installedDate || new Date().toISOString().slice(0, 10))
    if (!installedDate) return
    const nextRole = convertElectRole(a.role)
    setStatus(i, 'saving')
    try {
      const res = await fetch(`/api/admin/assignments/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole, installedDate }),
      })
      if (!res.ok) throw new Error(await res.text())
      setAssignments(prev => prev.map((a2, idx) => idx === i
        ? { ...a2, role: nextRole, installedDate, status: 'saved', error: '' }
        : a2
      ))
    } catch (e) {
      setStatus(i, 'error', e instanceof Error ? e.message : 'Conversion failed')
    }
  }

  async function confirmEnd(i: number) {
    const a = assignments[i]
    if (!a.endDateDraft) { setStatus(i, 'error', 'End date is required'); return }
    setStatus(i, 'saving')
    try {
      const res = await fetch(`/api/admin/assignments/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endDate: a.endDateDraft, endReason: a.endReasonDraft, isCurrent: false }),
      })
      if (!res.ok) throw new Error(await res.text())
      setAssignments(prev => prev.map((a2, idx) => idx === i
        ? { ...a2, endDate: a.endDateDraft, endReason: a.endReasonDraft, isCurrent: false, isEndingMode: false, status: 'saved', error: '' }
        : a2
      ))
      if (a.endReasonDraft === 'retired' || a.endReasonDraft === 'resigned') {
        const eRole = toEmeritusRole(a.role)
        if (eRole) {
          setEmeritusPrompt({
            seeId: a.seeId, seeName: a.seeName,
            role: eRole, startDate: a.endDateDraft,
            startReason: 'retired', status: 'idle', error: '',
          })
        }
      }
    } catch (e) {
      setStatus(i, 'error', e instanceof Error ? e.message : 'Save failed')
    }
  }

  async function confirmEmeritus() {
    if (!emeritusPrompt) return
    setEmeritusPrompt(prev => prev ? { ...prev, status: 'saving', error: '' } : null)
    try {
      const body = {
        personId,
        seeId: emeritusPrompt.seeId,
        role: emeritusPrompt.role,
        titleOverride: null,
        startDate: emeritusPrompt.startDate,
        endDate: null,
        startReason: emeritusPrompt.startReason,
        endReason: null,
        isCurrent: true,
      }
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const newRow: AssignmentRow = {
        id: data.id,
        seeId: emeritusPrompt.seeId,
        seeName: emeritusPrompt.seeName,
        role: emeritusPrompt.role,
        titleOverride: null,
        startDate: emeritusPrompt.startDate,
        installedDate: null,
        endDate: null,
        startReason: emeritusPrompt.startReason,
        endReason: null,
        isCurrent: true,
      }
      setAssignments(prev => [toLocal(newRow), ...prev])
      setEmeritusPrompt(null)
    } catch (e) {
      setEmeritusPrompt(prev => prev ? { ...prev, status: 'error', error: e instanceof Error ? e.message : 'Failed' } : null)
    }
  }

  return (
    <>
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-body text-sm font-semibold text-text-primary">Assignments</h2>
          <button
            type="button"
            onClick={() => setAssignments(prev => [blank(personId), ...prev])}
            className="text-sm font-body text-burgundy hover:underline"
          >
            + Add assignment
          </button>
        </div>

        {assignments.length === 0 && (
          <p className="px-6 py-5 text-sm font-body text-text-tertiary">No assignments yet.</p>
        )}

        <div className="divide-y divide-border">
          {assignments.map((a, i) => (
            <div key={a.id ?? `new-${i}`} className="px-6 py-5 space-y-4">
              {/* See + role row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>See</FieldLabel>
                  <SeePicker
                    value={a.seeId ? { id: a.seeId, name: a.seeName } : null}
                    onChange={v => update(i, { seeId: v?.id ?? '', seeName: v?.name ?? '' })}
                    allowCreate
                  />
                </div>
                <div>
                  <FieldLabel>Role</FieldLabel>
                  <select value={a.role} onChange={e => update(i, { role: e.target.value })} className={selectClass()}>
                    {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Appointed date</FieldLabel>
                  <input type="date" value={a.startDate} onChange={e => update(i, { startDate: e.target.value })} className={inputClass()} />
                </div>
                <div>
                  <FieldLabel>Installed date</FieldLabel>
                  <input type="date" value={a.installedDate} onChange={e => update(i, { installedDate: e.target.value })} className={inputClass()} />
                </div>
                <div>
                  <FieldLabel>End date</FieldLabel>
                  <input type="date" value={a.endDate} onChange={e => update(i, { endDate: e.target.value, isCurrent: !e.target.value })} className={inputClass()} />
                </div>
              </div>

              {/* Reasons */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Start reason</FieldLabel>
                  <select value={a.startReason} onChange={e => update(i, { startReason: e.target.value })} className={selectClass()}>
                    {START_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>End reason</FieldLabel>
                  <select value={a.endReason} onChange={e => update(i, { endReason: e.target.value })} className={selectClass()}>
                    <option value="">—</option>
                    {END_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* End assignment mode */}
              {a.isEndingMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-4 space-y-3">
                  <p className="text-xs font-body font-semibold text-amber-800 uppercase tracking-wide">End this assignment</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>End date</FieldLabel>
                      <input type="date" value={a.endDateDraft} onChange={e => update(i, { endDateDraft: e.target.value })} className={inputClass()} />
                    </div>
                    <div>
                      <FieldLabel>End reason</FieldLabel>
                      <select value={a.endReasonDraft} onChange={e => update(i, { endReasonDraft: e.target.value })} className={selectClass()}>
                        {END_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => confirmEnd(i)} disabled={a.status === 'saving'} className="px-3 py-1.5 bg-amber-600 text-white text-sm font-body font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50">
                      {a.status === 'saving' ? 'Saving…' : 'Confirm end'}
                    </button>
                    <button onClick={() => update(i, { isEndingMode: false })} className="px-3 py-1.5 text-sm font-body text-text-secondary hover:text-text-primary">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                {isElectRole(a.role) && (
                  <button onClick={() => markOrdainedInstalled(i)} disabled={a.status === 'saving'} className="px-4 py-2 bg-green-700 text-white text-sm font-body font-semibold rounded-lg hover:bg-green-800 disabled:opacity-50">
                    Mark as Ordained/Installed
                  </button>
                )}
                <button onClick={() => save(i)} disabled={a.status === 'saving'} className="px-4 py-2 bg-burgundy text-white text-sm font-body font-semibold rounded-lg hover:bg-burgundy/90 disabled:opacity-50">
                  {a.status === 'saving' ? 'Saving…' : 'Save'}
                </button>
                {a.isCurrent && a.id && !a.isEndingMode && (
                  <button onClick={() => update(i, { isEndingMode: true })} className="px-4 py-2 border border-border text-sm font-body text-text-secondary hover:text-text-primary rounded-lg transition-colors">
                    End assignment
                  </button>
                )}
                <button onClick={() => remove(i)} disabled={a.status === 'saving'} className="px-4 py-2 text-sm font-body text-red-600 hover:underline disabled:opacity-50">
                  Delete
                </button>
                {a.status === 'saved' && <span className="text-sm font-body text-green-600">Saved</span>}
                {a.status === 'error'  && <span className="text-sm font-body text-red-600">{a.error}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emeritus prompt modal */}
      {emeritusPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-border shadow-xl w-[480px] max-w-[90vw] p-6 space-y-4">
            <h3 className="font-body text-sm font-semibold text-text-primary">Create emeritus assignment?</h3>
            <p className="text-sm font-body text-text-secondary">
              The assignment ended with retirement. Would you like to create an emeritus assignment for the same see?
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>See</FieldLabel>
                <p className="text-sm font-body text-text-primary px-3 py-2 border border-border rounded-lg bg-surface">{emeritusPrompt.seeName}</p>
              </div>
              <div>
                <FieldLabel>Role</FieldLabel>
                <select
                  value={emeritusPrompt.role}
                  onChange={e => setEmeritusPrompt(prev => prev ? { ...prev, role: e.target.value } : null)}
                  className={selectClass()}
                >
                  {['archbishop_emeritus', 'bishop_emeritus', 'auxiliary_emeritus', 'coadjutor_emeritus'].map(r => (
                    <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Start date</FieldLabel>
                <input
                  type="date"
                  value={emeritusPrompt.startDate}
                  onChange={e => setEmeritusPrompt(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                  className={inputClass()}
                />
              </div>
              <div>
                <FieldLabel>Start reason</FieldLabel>
                <select
                  value={emeritusPrompt.startReason}
                  onChange={e => setEmeritusPrompt(prev => prev ? { ...prev, startReason: e.target.value } : null)}
                  className={selectClass()}
                >
                  {START_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {emeritusPrompt.status === 'error' && (
              <p className="text-sm font-body text-red-600">{emeritusPrompt.error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={confirmEmeritus}
                disabled={emeritusPrompt.status === 'saving'}
                className="px-4 py-2 bg-burgundy text-white text-sm font-body font-semibold rounded-lg hover:bg-burgundy/90 disabled:opacity-50"
              >
                {emeritusPrompt.status === 'saving' ? 'Creating…' : 'Create assignment'}
              </button>
              <button
                onClick={() => setEmeritusPrompt(null)}
                className="px-4 py-2 text-sm font-body text-text-secondary hover:text-text-primary"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
