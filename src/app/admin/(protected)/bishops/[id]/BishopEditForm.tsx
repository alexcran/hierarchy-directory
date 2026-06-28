'use client'
import { useState } from 'react'
import { ReligiousOrderCombobox, type ReligiousOrderOption } from '@/components/ui/ReligiousOrderCombobox'

interface Field {
  key: string
  label: string
  type?: 'text' | 'url' | 'date' | 'textarea' | 'order'
  placeholder?: string
}

const SECTIONS: { heading: string; fields: Field[] }[] = [
  {
    heading: 'Name',
    fields: [
      { key: 'firstName',       label: 'First name',       placeholder: 'e.g. Timothy' },
      { key: 'middleName',      label: 'Middle name' },
      { key: 'lastName',        label: 'Last name',        placeholder: 'e.g. Dolan' },
      { key: 'suffix',          label: 'Suffix',           placeholder: 'e.g. Jr.' },
      { key: 'religiousOrderId', label: 'Religious order', type: 'order' },
      { key: 'styleOfAddress',  label: 'Style of address', placeholder: 'e.g. His Eminence' },
    ],
  },
  {
    heading: 'Biography',
    fields: [
      { key: 'dateOfBirth',  label: 'Date of birth', type: 'date' },
      { key: 'dateOfDeath',  label: 'Date of death', type: 'date' },
      { key: 'placeOfBirth', label: 'Place of birth', placeholder: 'City, State' },
      { key: 'motto',        label: 'Episcopal motto', placeholder: 'e.g. "Peace Be With You"' },
    ],
  },
  {
    heading: 'External links',
    fields: [
      { key: 'catholicHierarchyId', label: 'Catholic-Hierarchy ID', placeholder: 'e.g. bdolan' },
      { key: 'gcatholicId',         label: 'GCatholic ID',          placeholder: 'e.g. 1234' },
      { key: 'wikipediaUrl',        label: 'Wikipedia URL',         type: 'url', placeholder: 'https://en.wikipedia.org/…' },
      { key: 'diocesanBioUrl',      label: 'Diocesan bio URL',      type: 'url', placeholder: 'https://…' },
    ],
  },
]

type Status = 'idle' | 'saving' | 'saved' | 'error'

export function BishopEditForm({
  person,
  religiousOrders,
}: {
  person: Record<string, string | null>
  religiousOrders: ReligiousOrderOption[]
}) {
  const [fields, setFields] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(person).map(([k, v]) => [k, v ?? ''])
    )
  )
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function set(key: string, value: string) {
    setFields(prev => ({ ...prev, [key]: value }))
    if (status === 'saved') setStatus('idle')
  }

  async function handleSave() {
    setStatus('saving')
    setErrorMsg('')
    try {
      const res = await fetch(`/api/admin/bishops/${person.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (!res.ok) throw new Error(await res.text())
      setStatus('saved')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-8">
      {SECTIONS.map(section => (
        <div key={section.heading} className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-body text-sm font-semibold text-text-primary">{section.heading}</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            {section.fields.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-body font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                  {f.label}
                </label>
                {f.type === 'order' ? (
                  <ReligiousOrderCombobox
                    value={fields[f.key] ?? ''}
                    onChange={v => set(f.key, v)}
                    options={religiousOrders}
                    placeholder="Search by name or abbreviation…"
                  />
                ) : f.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={fields[f.key] ?? ''}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors resize-none"
                  />
                ) : (
                  <input
                    type={f.type ?? 'text'}
                    value={fields[f.key] ?? ''}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Save bar */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="px-5 py-2.5 bg-burgundy text-white text-sm font-body font-semibold rounded-lg hover:bg-burgundy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
        {status === 'saved' && (
          <span className="text-sm font-body text-green-600">Saved</span>
        )}
        {status === 'error' && (
          <span className="text-sm font-body text-red-600">{errorMsg || 'Save failed'}</span>
        )}
      </div>
    </div>
  )
}
