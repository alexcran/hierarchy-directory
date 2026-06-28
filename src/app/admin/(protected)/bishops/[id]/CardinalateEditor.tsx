'use client'
import { useState } from 'react'

interface CardinalateData {
  dateCreated: string
  cardinalOrder: string
  titularChurch: string
  isElector: boolean
}

interface Props {
  personId: string
  initial: CardinalateData | null
}

type Status = 'idle' | 'saving' | 'saved' | 'error'

const ORDER_OPTIONS = [
  { value: 'deacon', label: 'Cardinal Deacon' },
  { value: 'priest', label: 'Cardinal Priest' },
  { value: 'bishop', label: 'Cardinal Bishop' },
]

export function CardinalateEditor({ personId, initial }: Props) {
  const [isCardinal, setIsCardinal] = useState(!!initial)
  const [fields, setFields] = useState<CardinalateData>(
    initial ?? { dateCreated: '', cardinalOrder: 'priest', titularChurch: '', isElector: true }
  )
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function set<K extends keyof CardinalateData>(key: K, value: CardinalateData[K]) {
    setFields(prev => ({ ...prev, [key]: value }))
    if (status === 'saved') setStatus('idle')
  }

  async function handleToggle(checked: boolean) {
    setIsCardinal(checked)
    if (!checked && initial) {
      // Remove cardinalate
      setStatus('saving')
      const res = await fetch(`/api/admin/cardinalate/${personId}`, { method: 'DELETE' })
      setStatus(res.ok ? 'idle' : 'error')
    }
  }

  async function handleSave() {
    setStatus('saving')
    setErrorMsg('')
    const res = await fetch(`/api/admin/cardinalate/${personId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    if (res.ok) { setStatus('saved') }
    else { setErrorMsg('Save failed'); setStatus('error') }
  }

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-body text-sm font-semibold text-text-primary">Cardinalate</h2>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-xs font-body text-text-secondary">Is Cardinal</span>
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={isCardinal}
              onChange={e => handleToggle(e.target.checked)}
            />
            <div className={`w-9 h-5 rounded-full transition-colors ${isCardinal ? 'bg-burgundy' : 'bg-border'}`} />
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isCardinal ? 'translate-x-4' : ''}`} />
          </div>
        </label>
      </div>

      {isCardinal && (
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-body font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Date created</label>
              <input
                type="date"
                value={fields.dateCreated}
                onChange={e => set('dateCreated', e.target.value)}
                className="w-full px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-body font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Cardinal order</label>
              <select
                value={fields.cardinalOrder}
                onChange={e => set('cardinalOrder', e.target.value)}
                className="w-full px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors"
              >
                {ORDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-body font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Titular church</label>
            <input
              type="text"
              value={fields.titularChurch}
              onChange={e => set('titularChurch', e.target.value)}
              placeholder="e.g. San Clemente"
              className="w-full px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={fields.isElector}
              onChange={e => set('isElector', e.target.checked)}
              className="rounded border-border text-burgundy focus:ring-burgundy/30"
            />
            <span className="text-sm font-body text-text-secondary">Cardinal elector (under 80)</span>
          </label>

          <div className="flex items-center gap-4 pt-1">
            <button
              onClick={handleSave}
              disabled={status === 'saving'}
              className="px-4 py-2 bg-burgundy text-white text-sm font-body font-semibold rounded-lg hover:bg-burgundy/90 transition-colors disabled:opacity-50"
            >
              {status === 'saving' ? 'Saving…' : 'Save'}
            </button>
            {status === 'saved' && <span className="text-sm font-body text-green-600">Saved</span>}
            {status === 'error' && <span className="text-sm font-body text-red-600">{errorMsg || 'Error'}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
