'use client'
import { useState } from 'react'
import Link from 'next/link'
import { BishopPortrait } from '@/components/bishop/BishopPortrait'

type Rank = 'Cardinal' | 'Archbishop' | 'Bishop'

export interface BishopRow {
  id: string
  slug: string
  displayName: string
  rank: Rank
  portraitUrl: string | null
  currentSee: string | null
  currentRole: string | null
  updatedAt: string
}

const RANK_STYLE: Record<Rank, string> = {
  Cardinal:   'bg-red-50 text-red-700',
  Archbishop: 'bg-green-50 text-green-700',
  Bishop:     'bg-green-50 text-green-700',
}

function rankColor(rank: Rank): string {
  return rank === 'Cardinal' ? '#C41E3A' : '#007A00'
}

function roleLabel(role: string | null) {
  if (!role) return '—'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export function BishopListClient({ bishops }: { bishops: BishopRow[] }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? bishops.filter(b => b.displayName.toLowerCase().includes(query.toLowerCase()))
    : bishops

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
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide w-10"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide">Current See</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(b => (
              <tr key={b.id} className="hover:bg-surface transition-colors">
                {/* Portrait */}
                <td className="px-4 py-2">
                  <BishopPortrait
                    src={b.portraitUrl}
                    name={b.displayName}
                    width={32}
                    height={32}
                    rankColor={rankColor(b.rank)}
                    barHeight={4}
                  />
                </td>

                {/* Name */}
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/bishops/${b.id}`}
                    className="text-text-primary font-medium hover:text-burgundy hover:underline"
                  >
                    {b.displayName}
                  </Link>
                </td>

                {/* Rank */}
                <td className="px-4 py-2">
                  <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md ${RANK_STYLE[b.rank]}`}>
                    {b.rank}
                  </span>
                </td>

                {/* See */}
                <td className="px-4 py-2 text-text-secondary">{b.currentSee ?? '—'}</td>

                {/* Role */}
                <td className="px-4 py-2 text-text-secondary">{roleLabel(b.currentRole)}</td>

                {/* Updated */}
                <td className="px-4 py-2 text-text-tertiary text-xs">
                  {new Date(b.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-tertiary">
                  No bishops match &ldquo;{query}&rdquo;
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-text-tertiary font-body">
        {filtered.length} of {bishops.length} bishops
        {bishops.filter(b => !b.portraitUrl).length > 0 && (
          <> · <span className="text-amber-600">{bishops.filter(b => !b.portraitUrl).length} missing portraits</span></>
        )}
      </p>
    </div>
  )
}
