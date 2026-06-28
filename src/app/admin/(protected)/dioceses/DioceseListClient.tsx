'use client'
import { useState } from 'react'
import Link from 'next/link'

export interface DioceseRow {
  id: string
  slug: string
  displayName: string
  seeType: string
  province: string | null
  currentOrdinary: string | null
  hasCoatOfArms: boolean
  updatedAt: string
}

const TYPE_STYLE: Record<string, string> = {
  archdiocese: 'bg-burgundy/10 text-burgundy',
  diocese:     'bg-blue-50 text-blue-700',
}

export function DioceseListClient({ dioceses }: { dioceses: DioceseRow[] }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? dioceses.filter(d => d.displayName.toLowerCase().includes(query.toLowerCase()))
    : dioceses

  return (
    <div>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full max-w-sm px-3 py-2 text-sm font-body border border-border rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy transition-colors"
        />
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide w-8"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide">Province</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide">Current Ordinary</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(d => (
              <tr key={d.id} className="hover:bg-surface transition-colors">
                {/* Coat of arms indicator */}
                <td className="px-4 py-2">
                  <div
                    className={`w-2 h-2 rounded-full ${d.hasCoatOfArms ? 'bg-green-400' : 'bg-amber-300'}`}
                    title={d.hasCoatOfArms ? 'Has coat of arms' : 'Missing coat of arms'}
                  />
                </td>

                {/* Name */}
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/dioceses/${d.id}`}
                    className="text-text-primary font-medium hover:text-burgundy hover:underline"
                  >
                    {d.displayName}
                  </Link>
                </td>

                {/* Type */}
                <td className="px-4 py-2">
                  <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md capitalize ${TYPE_STYLE[d.seeType] ?? 'bg-surface text-text-secondary'}`}>
                    {d.seeType}
                  </span>
                </td>

                <td className="px-4 py-2 text-text-secondary text-xs">{d.province ?? '—'}</td>
                <td className="px-4 py-2 text-text-secondary">{d.currentOrdinary ?? '—'}</td>
                <td className="px-4 py-2 text-text-tertiary text-xs">
                  {new Date(d.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-tertiary">
                  No dioceses match &ldquo;{query}&rdquo;
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-text-tertiary font-body">
        {filtered.length} of {dioceses.length} dioceses
        {dioceses.filter(d => !d.hasCoatOfArms).length > 0 && (
          <> · <span className="text-amber-600">{dioceses.filter(d => !d.hasCoatOfArms).length} missing coat of arms</span></>
        )}
      </p>
    </div>
  )
}
