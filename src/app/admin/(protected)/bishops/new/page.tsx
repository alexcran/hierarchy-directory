'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const FIELDS = [
  { key: 'firstName',      label: 'First name',      required: true,  placeholder: 'e.g. Timothy' },
  { key: 'middleName',     label: 'Middle name',      required: false, placeholder: '' },
  { key: 'lastName',       label: 'Last name',        required: true,  placeholder: 'e.g. Dolan' },
  { key: 'suffix',         label: 'Suffix',           required: false, placeholder: 'e.g. Jr.' },
  { key: 'religiousOrder', label: 'Religious order',  required: false, placeholder: 'e.g. O.F.M. Cap.' },
] as const

type FieldKey = typeof FIELDS[number]['key']

export default function NewBishopPage() {
  const router = useRouter()
  const [fields, setFields] = useState<Record<FieldKey, string>>({
    firstName: '', middleName: '', lastName: '', suffix: '', religiousOrder: '',
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function set(key: FieldKey, value: string) {
    setFields(prev => ({ ...prev, [key]: value }))
    if (status === 'error') setStatus('idle')
  }

  async function handleCreate() {
    if (!fields.firstName.trim() || !fields.lastName.trim()) {
      setErrorMsg('First name and last name are required.')
      setStatus('error')
      return
    }
    setStatus('saving')
    setErrorMsg('')
    try {
      const res = await fetch('/api/admin/bishops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to create bishop')
      }
      const { id } = await res.json()
      router.push(`/admin/bishops/${id}`)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to create bishop')
      setStatus('error')
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors'
  const labelCls = 'block text-xs font-body font-semibold text-text-secondary mb-1.5 uppercase tracking-wide'

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/bishops" className="text-sm font-body text-text-tertiary hover:text-text-primary transition-colors">
          ← Bishops
        </Link>
        <span className="text-text-tertiary">/</span>
        <h1 className="font-display text-2xl font-semibold text-text-primary">New Bishop</h1>
      </div>

      <div className="max-w-lg space-y-6">
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-body text-sm font-semibold text-text-primary">Name</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className={labelCls}>
                  {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  type="text"
                  value={fields[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs font-body text-text-tertiary leading-relaxed">
          After creating, you&apos;ll be taken to the full edit page to add assignments, portrait, ordination, consecration, and more.
        </p>

        <div className="flex items-center gap-4">
          <button
            onClick={handleCreate}
            disabled={status === 'saving'}
            className="px-5 py-2.5 bg-burgundy text-white text-sm font-body font-semibold rounded-lg hover:bg-burgundy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'saving' ? 'Creating…' : 'Create Bishop'}
          </button>
          <Link
            href="/admin/bishops"
            className="px-5 py-2.5 text-sm font-body font-medium border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
          >
            Cancel
          </Link>
          {status === 'error' && (
            <span className="text-sm font-body text-red-600">{errorMsg}</span>
          )}
        </div>
      </div>
    </>
  )
}
