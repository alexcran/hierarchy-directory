'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { BishopPortrait } from '@/components/bishop/BishopPortrait'

export interface AssignmentRow {
  id: string
  personId: string
  personName: string
  portraitUrl: string | null
  isCardinal: boolean
  seeName: string
  role: string
  startDate: string
  endDate: string | null
  isCurrent: boolean
}

const ROLE_LABEL: Record<string, string> = {
  ordinary:                'Ordinary',
  auxiliary:               'Auxiliary',
  coadjutor:               'Coadjutor',
  apostolic_administrator: 'Apostolic Admin.',
  apostolic_nuncio:        'Apostolic Nuncio',
  curial_prefect:          'Curial Prefect',
  curial_secretary:        'Curial Secretary',
  curial_president:        'Curial President',
  curial_member:           'Curial Member',
  papal_legate:            'Papal Legate',
  vicar_general:           'Vicar General',
  archpriest:              'Archpriest',
  archbishop_emeritus:     'Archbishop Emeritus',
  bishop_emeritus:         'Bishop Emeritus',
  auxiliary_emeritus:      'Auxiliary Emeritus',
  coadjutor_emeritus:      'Coadjutor Emeritus',
}

function fmtRole(role: string) {
  return ROLE_LABEL[role] ?? role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type SortCol = 'name' | 'see' | 'role' | 'startDate' | 'endDate' | 'current'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="w-3 h-3 text-text-tertiary ml-1 inline" />
  return dir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-burgundy ml-1 inline" />
    : <ChevronDown className="w-3 h-3 text-burgundy ml-1 inline" />
}

export function AssignmentsClient({ assignments }: { assignments: AssignmentRow[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [sortCol, setSortCol] = useState<SortCol>('current')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [showCurrentOnly, setShowCurrentOnly] = useState(false)

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir(col === 'current' || col === 'startDate' || col === 'endDate' ? 'desc' : 'asc')
    }
  }

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = assignments

    if (showCurrentOnly) rows = rows.filter(r => r.isCurrent)

    if (q) {
      rows = rows.filter(r =>
        r.personName.toLowerCase().includes(q) ||
        r.seeName.toLowerCase().includes(q) ||
        fmtRole(r.role).toLowerCase().includes(q),
      )
    }

    return [...rows].sort((a, b) => {
      let cmp = 0
      switch (sortCol) {
        case 'name':      cmp = a.personName.localeCompare(b.personName); break
        case 'see':       cmp = a.seeName.localeCompare(b.seeName); break
        case 'role':      cmp = a.role.localeCompare(b.role); break
        case 'startDate': cmp = (a.startDate ?? '').localeCompare(b.startDate ?? ''); break
        case 'endDate':   cmp = (a.endDate ?? '').localeCompare(b.endDate ?? ''); break
        case 'current':   cmp = Number(a.isCurrent) - Number(b.isCurrent); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [assignments, query, sortCol, sortDir, showCurrentOnly])

  const thCls = 'px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide cursor-pointer select-none hover:text-text-primary transition-colors whitespace-nowrap'

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="search"
          placeholder="Search by name, see, or role…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full max-w-sm px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors"
        />
        <label className="flex items-center gap-2 text-sm font-body text-text-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showCurrentOnly}
            onChange={e => setShowCurrentOnly(e.target.checked)}
            className="accent-burgundy"
          />
          Current only
        </label>
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-3 w-10"></th>
                <th className={thCls} onClick={() => handleSort('name')}>
                  Bishop <SortIcon active={sortCol === 'name'} dir={sortDir} />
                </th>
                <th className={thCls} onClick={() => handleSort('see')}>
                  See <SortIcon active={sortCol === 'see'} dir={sortDir} />
                </th>
                <th className={thCls} onClick={() => handleSort('role')}>
                  Role <SortIcon active={sortCol === 'role'} dir={sortDir} />
                </th>
                <th className={thCls} onClick={() => handleSort('startDate')}>
                  Start <SortIcon active={sortCol === 'startDate'} dir={sortDir} />
                </th>
                <th className={thCls} onClick={() => handleSort('endDate')}>
                  End <SortIcon active={sortCol === 'endDate'} dir={sortDir} />
                </th>
                <th className={thCls} onClick={() => handleSort('current')}>
                  Status <SortIcon active={sortCol === 'current'} dir={sortDir} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map(row => (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/admin/bishops/${row.personId}`)}
                  className="hover:bg-surface transition-colors cursor-pointer"
                >
                {/* Portrait */}
                <td className="px-4 py-2">
                    <BishopPortrait
                      src={row.portraitUrl}
                      name={row.personName}
                      width={32}
                      height={32}
                      rankColor={row.isCardinal ? '#C41E3A' : '#007A00'}
                      barHeight={4}
                    />
                  </td>

                  {/* Bishop name */}
                  <td className="px-4 py-2 font-medium text-text-primary whitespace-nowrap">
                    {row.personName}
                  </td>

                  {/* See */}
                  <td className="px-4 py-2 text-text-secondary">{row.seeName}</td>

                  {/* Role */}
                  <td className="px-4 py-2 text-text-secondary">{fmtRole(row.role)}</td>

                  {/* Start date */}
                  <td className="px-4 py-2 text-text-secondary tabular-nums">{fmtDate(row.startDate)}</td>

                  {/* End date */}
                  <td className="px-4 py-2 text-text-secondary tabular-nums">{fmtDate(row.endDate)}</td>

                  {/* Current badge */}
                  <td className="px-4 py-2">
                    {row.isCurrent ? (
                      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-green-50 text-green-700">
                        Current
                      </span>
                    ) : (
                      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-surface text-text-tertiary">
                        Past
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-tertiary">
                    {query ? `No assignments match "${query}"` : 'No assignments found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-text-tertiary font-body">
        {sorted.length} of {assignments.length} assignments
        {' · '}
        {assignments.filter(a => a.isCurrent).length} current
      </p>
    </div>
  )
}
