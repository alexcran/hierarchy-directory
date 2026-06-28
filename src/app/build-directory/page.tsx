'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { GripVertical, X, Search, ChevronRight, Download, FileText, Settings, Eye } from 'lucide-react'
import { useSelection } from '@/contexts/SelectionContext'
import { BishopPortrait } from '@/components/bishop/BishopPortrait'
import { useDebounce } from '@/hooks/useDebounce'
import { DirectoryPDFDocument } from '@/components/directory/DirectoryPDFDocument'
import type { TypeaheadResult } from '@/lib/queries/search'
import type { BishopEntry, DirectoryConfig, DirectoryFields } from '@/components/directory/types'

// Load PDF components client-side only
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((m) => ({ default: m.PDFViewer })),
  { ssr: false, loading: () => <PdfLoading /> },
)

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4

const DEFAULT_CONFIG: DirectoryConfig = {
  fields: {
    // Current Role
    diocese:              true,
    title:                false,
    styleOfAddress:       false,
    // Biographical
    dateOfBirth:          false,
    placeOfBirth:         false,
    dateOfDeath:          false,
    // Ordination
    priestOrdDate:        false,
    priestOrdLocation:    false,
    episcopalConsDate:    false,
    episcopalConsLocation: false,
    principalConsecrator: false,
    // Other
    rite:                 false,
    education:            false,
  },
  gridDensity:   'medium',
  sort:          'alphabetical',
  coverPage:     false,
  coverTitle:    'Catholic Bishops Directory',
  coverSubtitle: 'United States',
  pageSize:      'letter',
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { n: 1 as Step, label: 'Review',    icon: FileText },
  { n: 2 as Step, label: 'Configure', icon: Settings },
  { n: 3 as Step, label: 'Preview',   icon: Eye },
  { n: 4 as Step, label: 'Export',    icon: Download },
]

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done    = current > s.n
        const active  = current === s.n
        const Icon    = s.icon
        return (
          <div key={s.n} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              active  ? 'bg-burgundy text-white' :
              done    ? 'text-burgundy'           :
                        'text-text-tertiary'
            }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-body font-medium hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className={`w-4 h-4 mx-1 flex-shrink-0 ${current > s.n ? 'text-burgundy' : 'text-text-tertiary'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Bishop row (draggable) ───────────────────────────────────────────────────

function BishopRow({
  bishop,
  onRemove,
  dragProps,
}: {
  bishop: BishopEntry
  onRemove: () => void
  dragProps: React.HTMLAttributes<HTMLDivElement>
}) {
  return (
    <div
      {...dragProps}
      className="flex items-center gap-3 p-3 bg-white border border-border rounded-lg select-none"
    >
      <div className="text-text-tertiary cursor-grab active:cursor-grabbing touch-none flex-shrink-0">
        <GripVertical className="w-4 h-4" />
      </div>
      <BishopPortrait
        src={bishop.portraitUrl}
        name={bishop.displayName}
        width={48}
        height={64}
        rankColor={bishop.isCardinal ? '#C41E3A' : '#007A00'}
        barHeight={5}
      />
      <div className="flex-1 min-w-0">
        {bishop.styleOfAddress && (
          <p className="font-display text-xs italic leading-snug truncate" style={{ color: bishop.isCardinal ? '#C41E3A' : '#007A00' }}>
            {bishop.styleOfAddress}
          </p>
        )}
        <p className="font-display text-sm font-semibold text-text-primary leading-snug truncate">
          {bishop.displayName}
        </p>
        {bishop.currentTitle && (
          <p className="font-body text-xs text-text-secondary truncate mt-0.5">{bishop.currentTitle}</p>
        )}
        {bishop.currentSee && (
          <p className="font-body text-xs text-text-tertiary truncate">{bishop.currentSee}</p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="p-1 text-text-tertiary hover:text-text-primary transition-colors flex-shrink-0"
        aria-label={`Remove ${bishop.displayName}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Step 1: Review Selection ─────────────────────────────────────────────────

function Step1({
  bishops,
  onReorder,
  onRemove,
  onAdd,
}: {
  bishops: BishopEntry[]
  onReorder: (b: BishopEntry[]) => void
  onRemove: (id: string) => void
  onAdd: (b: BishopEntry) => void
}) {
  const dragIndex = useRef<number | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TypeaheadResult | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  // Typeahead search
  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults(null); setSearchOpen(false); return }
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((d: TypeaheadResult) => {
        // Filter out already-added bishops
        const existingIds = new Set(bishops.map((b) => b.id))
        const filtered: TypeaheadResult = {
          bishops: d.bishops.filter((b) => !existingIds.has(b.id)),
          dioceses: [],
        }
        setResults(filtered)
        setSearchOpen(filtered.bishops.length > 0)
      })
      .catch(() => {})
  }, [debouncedQuery, bishops])

  // Close search on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  async function addBishop(id: string) {
    setQuery('')
    setSearchOpen(false)
    const res = await fetch(`/api/bishops/batch?ids=${id}`)
    const [b] = await res.json()
    if (b) onAdd(b)
  }

  // HTML5 drag-and-drop reorder
  function handleDragStart(i: number) {
    dragIndex.current = i
  }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === i) return
    const next = [...bishops]
    const [moved] = next.splice(dragIndex.current, 1)
    next.splice(i, 0, moved)
    dragIndex.current = i
    onReorder(next)
  }
  function handleDragEnd() {
    dragIndex.current = null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-text-primary">
          Selected Bishops ({bishops.length})
        </h2>
      </div>

      {bishops.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-border rounded-lg">
          <p className="font-body text-text-secondary mb-1">No bishops selected.</p>
          <p className="font-body text-sm text-text-tertiary">
            Search below or select bishops from the{' '}
            <a href="/bishops" className="text-burgundy hover:underline">Bishops page</a>.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {bishops.map((b, i) => (
            <BishopRow
              key={b.id}
              bishop={b}
              onRemove={() => onRemove(b.id)}
              dragProps={{
                draggable: true,
                onDragStart: () => handleDragStart(i),
                onDragOver: (e) => handleDragOver(e as React.DragEvent, i),
                onDragEnd: handleDragEnd,
              }}
            />
          ))}
        </div>
      )}

      {/* Add bishop search */}
      <div ref={searchRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          <input
            type="search"
            placeholder="Search to add a bishop…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results?.bishops.length && setSearchOpen(true)}
            className="w-full pl-9 pr-4 py-2.5 text-sm font-body bg-white border border-border rounded-lg placeholder:text-text-tertiary text-text-primary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
          />
        </div>

        {searchOpen && results && results.bishops.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden z-20">
            {results.bishops.map((b) => (
              <button
                key={b.id}
                onMouseDown={() => addBishop(b.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-surface text-left transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-body font-medium text-text-secondary flex-shrink-0 uppercase">
                  {b.name.replace(/^Most Rev\.\s+/, '').split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-body text-text-primary truncate">{b.name}</p>
                  {b.title && <p className="text-xs text-text-tertiary truncate">{b.title}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step 2: Configure Layout ─────────────────────────────────────────────────

function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string; description?: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div>
      <p className="font-body text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-body border transition-colors ${
              value === opt.value
                ? 'border-burgundy bg-burgundy text-white font-medium'
                : 'border-border text-text-primary hover:bg-surface hover:border-text-secondary'
            }`}
          >
            {opt.label}
            {opt.description && (
              <span className={`block text-xs mt-0.5 ${value === opt.value ? 'text-white/80' : 'text-text-tertiary'}`}>
                {opt.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function FieldChip({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`px-4 py-2 rounded-lg text-sm font-body border transition-colors text-left ${
        checked
          ? 'border-burgundy bg-burgundy text-white font-medium'
          : 'border-border text-text-primary hover:bg-surface hover:border-text-secondary'
      }`}
    >
      {label}
      {description && (
        <span className={`block text-xs mt-0.5 ${checked ? 'text-white/80' : 'text-text-tertiary'}`}>
          {description}
        </span>
      )}
    </button>
  )
}

const FIELD_GROUPS: Array<{
  label: string
  fields: Array<{ key: keyof DirectoryFields; label: string; description?: string }>
}> = [
  {
    label: 'Current Role',
    fields: [
      { key: 'diocese',        label: 'Diocese',          description: 'See name' },
      { key: 'title',          label: 'Title',            description: 'Role + see' },
      { key: 'styleOfAddress', label: 'Style of Address', description: 'His Eminence / Excellency' },
    ],
  },
  {
    label: 'Biographical',
    fields: [
      { key: 'dateOfBirth',  label: 'Date of Birth' },
      { key: 'placeOfBirth', label: 'Place of Birth' },
      { key: 'dateOfDeath',  label: 'Date of Death' },
    ],
  },
  {
    label: 'Ordination',
    fields: [
      { key: 'priestOrdDate',         label: 'Priesthood Ord. Date' },
      { key: 'priestOrdLocation',     label: 'Priesthood Ord. Location' },
      { key: 'episcopalConsDate',     label: 'Consecration Date' },
      { key: 'episcopalConsLocation', label: 'Consecration Location' },
      { key: 'principalConsecrator',  label: 'Principal Consecrator' },
    ],
  },
  {
    label: 'Other',
    fields: [
      { key: 'rite',      label: 'Rite',      description: 'Non-Latin rites only' },
      { key: 'education', label: 'Education', description: 'Seminary / institutions' },
    ],
  },
]

function Step2({ config, onChange }: { config: DirectoryConfig; onChange: (c: DirectoryConfig) => void }) {
  function set<K extends keyof DirectoryConfig>(key: K, value: DirectoryConfig[K]) {
    onChange({ ...config, [key]: value })
  }
  function setField<K extends keyof DirectoryFields>(key: K, value: boolean) {
    set('fields', { ...config.fields, [key]: value })
  }

  const optionalCount = Object.values(config.fields).filter(Boolean).length
  const showWarning = optionalCount > 5 && config.gridDensity !== 'large'

  return (
    <div className="space-y-8">
      <h2 className="font-display text-xl font-semibold text-text-primary">Configure Layout</h2>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="font-body text-xs font-semibold text-text-tertiary uppercase tracking-wide">
            Included Fields
          </p>
          <span className={`text-xs font-body font-medium px-2 py-0.5 rounded-full ${
            optionalCount === 0 ? 'bg-surface text-text-tertiary' :
            optionalCount > 5  ? 'bg-amber-100 text-amber-700' :
                                 'bg-burgundy/10 text-burgundy'
          }`}>
            {optionalCount === 0 ? 'Name only' : `${optionalCount} field${optionalCount !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Fixed fields */}
        <div>
          <p className="font-body text-xs text-text-tertiary mb-2">Always included</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-4 py-2 rounded-lg text-sm font-body border border-border bg-surface text-text-tertiary cursor-default">
              Portrait
            </span>
            <span className="px-4 py-2 rounded-lg text-sm font-body border border-border bg-surface text-text-tertiary cursor-default">
              Name
            </span>
          </div>
        </div>

        {/* Optional field groups */}
        {FIELD_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="font-body text-xs text-text-tertiary mb-2">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.fields.map(({ key, label, description }) => (
                <FieldChip
                  key={key}
                  label={label}
                  description={description}
                  checked={config.fields[key]}
                  onChange={(v) => setField(key, v)}
                />
              ))}
            </div>
          </div>
        ))}

        {showWarning && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-body text-amber-800">
            <span className="flex-shrink-0 mt-0.5">⚠</span>
            <span>
              Many fields selected — entries may be small at this grid density.
              Consider using <button className="font-semibold underline" onClick={() => set('gridDensity', 'large')}>Large (3 per row)</button> for readability.
            </span>
          </div>
        )}
      </div>

      <ToggleGroup
        label="Grid Density"
        value={config.gridDensity}
        onChange={(v) => set('gridDensity', v)}
        options={[
          { value: 'large',   label: 'Large',   description: '3 per row' },
          { value: 'medium',  label: 'Medium',  description: '4 per row' },
          { value: 'compact', label: 'Compact', description: '6 per row' },
        ]}
      />

      <ToggleGroup
        label="Sort Order"
        value={config.sort}
        onChange={(v) => set('sort', v)}
        options={[
          { value: 'alphabetical', label: 'Alphabetical' },
          { value: 'see',         label: 'By See' },
          { value: 'seniority',   label: 'By Seniority' },
          { value: 'manual',      label: 'Manual' },
        ]}
      />

      <ToggleGroup
        label="Page Size"
        value={config.pageSize}
        onChange={(v) => set('pageSize', v)}
        options={[
          { value: 'letter', label: 'US Letter' },
          { value: 'a4',     label: 'A4' },
        ]}
      />

      {/* Cover page */}
      <div>
        <p className="font-body text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
          Cover Page
        </p>
        <label className="flex items-center gap-3 cursor-pointer mb-4">
          <div
            onClick={() => set('coverPage', !config.coverPage)}
            className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 relative cursor-pointer ${
              config.coverPage ? 'bg-burgundy' : 'bg-border'
            }`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              config.coverPage ? 'translate-x-5' : 'translate-x-1'
            }`} />
          </div>
          <span className="font-body text-sm text-text-primary">
            {config.coverPage ? 'Enabled' : 'Disabled'}
          </span>
        </label>

        {config.coverPage && (
          <div className="space-y-3 pl-0">
            <div>
              <label className="block font-body text-xs text-text-secondary mb-1">Title</label>
              <input
                type="text"
                value={config.coverTitle}
                onChange={(e) => set('coverTitle', e.target.value)}
                className="w-full px-3 py-2 text-sm font-body bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
              />
            </div>
            <div>
              <label className="block font-body text-xs text-text-secondary mb-1">Subtitle</label>
              <input
                type="text"
                value={config.coverSubtitle}
                onChange={(e) => set('coverSubtitle', e.target.value)}
                className="w-full px-3 py-2 text-sm font-body bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step 3: Preview ──────────────────────────────────────────────────────────

function PdfLoading() {
  return (
    <div className="flex items-center justify-center h-[600px] bg-surface rounded-lg border border-border">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-burgundy border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-body text-sm text-text-secondary">Rendering PDF…</p>
      </div>
    </div>
  )
}

function Step3({ bishops, config, generatedDate, logoSrc }: { bishops: BishopEntry[]; config: DirectoryConfig; generatedDate: string; logoSrc: string }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-text-primary">Preview</h2>
      <p className="font-body text-sm text-text-secondary">
        {bishops.length} {bishops.length === 1 ? 'bishop' : 'bishops'} · {config.gridDensity} density
      </p>
      <div className="w-full rounded-lg overflow-hidden border border-border">
        <PDFViewer width="100%" height={680} showToolbar={false}>
          <DirectoryPDFDocument bishops={bishops} config={config} generatedDate={generatedDate} logoSrc={logoSrc} />
        </PDFViewer>
      </div>
    </div>
  )
}

// ─── Step 4: Export ───────────────────────────────────────────────────────────

function Step4({ bishops, config, generatedDate, logoSrc }: { bishops: BishopEntry[]; config: DirectoryConfig; generatedDate: string; logoSrc: string }) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    setError(false)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const blob = await pdf(
        <DirectoryPDFDocument bishops={bishops} config={config} generatedDate={generatedDate} logoSrc={logoSrc} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hierarchy-directory-${Date.now()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError(true)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-text-primary">Export</h2>
      <div className="p-6 border border-border rounded-lg bg-surface/50 space-y-4">
        <div className="space-y-2">
          {[
            ['Bishops',    `${bishops.length}`],
            ['Fields', (() => {
              const on = Object.values(config.fields).filter(Boolean).length
              return on === 0 ? 'Name only' : `${on} optional field${on !== 1 ? 's' : ''}`
            })()],
            ['Density',    `${config.gridDensity} (${config.gridDensity === 'large' ? 3 : config.gridDensity === 'medium' ? 4 : 6}/row)`],
            ['Sort',       config.sort],
            ['Page size',  config.pageSize === 'letter' ? 'US Letter' : 'A4'],
            ['Cover page', config.coverPage ? 'Yes' : 'No'],
            ['Generated',  generatedDate],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm font-body">
              <span className="text-text-secondary">{k}</span>
              <span className="text-text-primary capitalize">{v}</span>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm font-body text-red-600">Failed to generate PDF. Please try again.</p>
        )}

        <button
          onClick={handleDownload}
          disabled={downloading || bishops.length === 0}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-burgundy text-white font-body font-semibold rounded-lg hover:bg-burgundy-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download PDF
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function fmtGeneratedDate(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function BuildDirectoryPage() {
  const { selectedIds, toggle, ready } = useSelection()
  const [step, setStep] = useState<Step>(1)
  const [bishops, setBishops] = useState<BishopEntry[]>([])
  const [config, setConfig] = useState<DirectoryConfig>(DEFAULT_CONFIG)
  const [loadingBishops, setLoadingBishops] = useState(true)
  const generatedDate = fmtGeneratedDate()
  const logoSrc = `${typeof window !== 'undefined' ? window.location.origin : ''}/hierarchy-directory-created-with-logo.png`
  const initialized = useRef(false)

  // Load initial selection from context — wait for localStorage to be loaded first
  useEffect(() => {
    if (!ready) return
    if (initialized.current) return
    initialized.current = true
    const ids = Array.from(selectedIds)
    if (ids.length === 0) { setLoadingBishops(false); return }
    fetch(`/api/bishops/batch?ids=${ids.join(',')}`)
      .then((r) => r.json())
      .then((data: BishopEntry[]) => setBishops(data))
      .catch(() => {})
      .finally(() => setLoadingBishops(false))
  }, [selectedIds, ready])

  const removeById = useCallback((id: string) => {
    setBishops((prev) => prev.filter((b) => b.id !== id))
    toggle(id)
  }, [toggle])

  const addBishop = useCallback((b: BishopEntry) => {
    setBishops((prev) => {
      if (prev.find((x) => x.id === b.id)) return prev
      return [...prev, b]
    })
    if (!selectedIds.has(b.id)) toggle(b.id)
  }, [selectedIds, toggle])

  const canAdvance =
    (step === 1 && bishops.length > 0) ||
    step === 2 ||
    step === 3

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 pb-24">
      <div className="mb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-text-primary leading-tight">
          Build a Directory
        </h1>
        <p className="font-body text-sm text-text-secondary mt-1">
          Select bishops, configure the layout, and download a printable PDF.
        </p>
      </div>

      <StepIndicator current={step} />

      {/* Step content */}
      <div className="min-h-[400px]">
        {step === 1 && !loadingBishops && (
          <Step1
            bishops={bishops}
            onReorder={setBishops}
            onRemove={removeById}
            onAdd={addBishop}
          />
        )}
        {step === 1 && loadingBishops && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-surface border border-border rounded-lg animate-pulse" />
            ))}
          </div>
        )}
        {step === 2 && <Step2 config={config} onChange={setConfig} />}
        {step === 3 && <Step3 bishops={bishops} config={config} generatedDate={generatedDate} logoSrc={logoSrc} />}
        {step === 4 && <Step4 bishops={bishops} config={config} generatedDate={generatedDate} logoSrc={logoSrc} />}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
          disabled={step === 1}
          className="px-5 py-2.5 text-sm font-body font-medium border border-border rounded-lg text-text-primary hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Back
        </button>

        {step < 4 && (
          <button
            onClick={() => setStep((s) => Math.min(4, s + 1) as Step)}
            disabled={!canAdvance}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-body font-semibold bg-burgundy text-white rounded-lg hover:bg-burgundy-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {step === 3 ? 'Continue to Export' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
