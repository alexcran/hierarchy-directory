'use client'
import { useState, useRef } from 'react'

interface Props {
  personId: string
  currentUrl: string | null
  currentPhotoCredit: string | null
}

export function PortraitUploader({ personId, currentUrl, currentPhotoCredit }: Props) {
  const [url, setUrl]                   = useState<string | null>(currentUrl)
  const [preview, setPreview]           = useState<string | null>(null)
  const [file, setFile]                 = useState<File | null>(null)
  const [dragging, setDragging]         = useState(false)
  const [status, setStatus]             = useState<'idle' | 'uploading' | 'deleting' | 'error'>('idle')
  const [errorMsg, setErrorMsg]         = useState('')
  const [credit, setCredit]             = useState(currentPhotoCredit ?? '')
  const [creditStatus, setCreditStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

  function acceptFile(f: File) {
    if (!['image/jpeg', 'image/png'].includes(f.type)) {
      setErrorMsg('Only JPEG or PNG files are accepted.')
      return
    }
    setFile(f)
    setErrorMsg('')
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) acceptFile(f)
  }

  async function handleUpload() {
    if (!file) return
    setStatus('uploading')
    setErrorMsg('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/admin/bishops/${personId}/portrait`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setUrl(data.url)
      setPreview(null)
      setFile(null)
      setStatus('idle')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Upload failed')
      setStatus('error')
    }
  }

  async function handleDelete() {
    if (!url) return
    setStatus('deleting')
    setErrorMsg('')
    try {
      const res = await fetch(`/api/admin/bishops/${personId}/portrait`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Delete failed')
      setUrl(null)
      setStatus('idle')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Delete failed')
      setStatus('error')
    }
  }

  async function saveCredit() {
    setCreditStatus('saving')
    try {
      const res = await fetch(`/api/admin/bishops/${personId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoCredit: credit || null }),
      })
      if (!res.ok) throw new Error()
      setCreditStatus('saved')
    } catch {
      setCreditStatus('error')
    }
  }

  const busy = status === 'uploading' || status === 'deleting'

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-body text-sm font-semibold text-text-primary">Portrait</h2>
      </div>
      <div className="px-6 py-5 space-y-4">

        {/* Current portrait */}
        {url && !preview && (
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Current portrait" className="w-20 h-[107px] object-cover object-top rounded-lg border border-border" />
            <div className="flex flex-col gap-2 mt-1">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="text-sm font-body text-burgundy hover:underline disabled:opacity-50"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="text-sm font-body text-red-600 hover:underline disabled:opacity-50"
              >
                {status === 'deleting' ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        )}

        {/* Preview of selected file */}
        {preview && (
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-20 h-[107px] object-cover object-top rounded-lg border border-border" />
            <div className="flex flex-col gap-2 mt-1">
              <button
                type="button"
                onClick={handleUpload}
                disabled={busy}
                className="px-3 py-1.5 bg-burgundy text-white text-sm font-body font-semibold rounded-lg hover:bg-burgundy/90 disabled:opacity-50"
              >
                {status === 'uploading' ? 'Uploading…' : 'Upload'}
              </button>
              <button
                type="button"
                onClick={() => { setPreview(null); setFile(null) }}
                disabled={busy}
                className="text-sm font-body text-text-secondary hover:text-text-primary disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Drop zone (shown when no preview) */}
        {!preview && (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg px-6 py-8 text-center cursor-pointer transition-colors ${
              dragging ? 'border-burgundy bg-burgundy/5' : 'border-border hover:border-burgundy/50 hover:bg-surface'
            }`}
          >
            <p className="text-sm font-body text-text-secondary">
              Drop a JPEG or PNG here, or <span className="text-burgundy">browse</span>
            </p>
            <p className="text-xs font-body text-text-tertiary mt-1">Max 5 MB</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f) }}
        />

        {errorMsg && <p className="text-sm font-body text-red-600">{errorMsg}</p>}

        {/* Photo credit */}
        <div>
          <label className="block text-xs font-body font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
            Photo Credit
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={credit}
              onChange={e => { setCredit(e.target.value); if (creditStatus === 'saved') setCreditStatus('idle') }}
              placeholder="e.g. Diocese of Richmond"
              className="flex-1 px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors"
            />
            <button
              type="button"
              onClick={saveCredit}
              disabled={creditStatus === 'saving'}
              className="px-3 py-2 bg-burgundy text-white text-sm font-body font-semibold rounded-lg hover:bg-burgundy/90 transition-colors disabled:opacity-50"
            >
              {creditStatus === 'saving' ? 'Saving…' : 'Save'}
            </button>
          </div>
          {creditStatus === 'saved' && <p className="text-xs font-body text-green-600 mt-1">Saved</p>}
          {creditStatus === 'error'  && <p className="text-xs font-body text-red-600 mt-1">Save failed</p>}
        </div>
      </div>
    </div>
  )
}
