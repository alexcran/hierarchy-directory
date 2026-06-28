'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { useSelection } from '@/contexts/SelectionContext'
import { formatName } from '@/lib/utils/formatName'
import { formatRoleTitle, getRankColor } from '@/lib/utils/formatTitle'
import { getStyleOfAddressColor } from '@/lib/utils/styleOfAddress'
import { getInitials } from '@/lib/utils/getInitials'
import { isElectRole } from '@/lib/utils/roles'
import type { BishopListItem } from '@/lib/queries/bishops'

interface BishopCardProps {
  bishop: BishopListItem
  priority?: boolean
  showStatus?: boolean
}

export function BishopCard({ bishop, priority, showStatus = false }: BishopCardProps) {
  const { isSelected, toggle } = useSelection()
  const router = useRouter()
  const selected = isSelected(bishop.id)

  const stripeColor = getRankColor(bishop.isCardinal)
  const soaColor = getStyleOfAddressColor(bishop.styleOfAddress)
  const cardName = formatName(bishop, { honorific: false })
  const roleTitle = bishop.currentAssignment
    ? formatRoleTitle(
        bishop.currentAssignment.role,
        bishop.currentAssignment.role.endsWith('_emeritus') ? '' : bishop.currentAssignment.seeName,
      )
    : null

  function handleCheckbox(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggle(bishop.id)
  }

  return (
    <div className="group relative">
      {/* Selection checkbox — appears on hover or when selected */}
      <button
        onClick={handleCheckbox}
        aria-label={selected ? 'Remove from selection' : 'Add to selection'}
        className={`absolute top-2.5 right-2.5 z-20 w-5 h-5 rounded flex items-center justify-center transition-all duration-150 ${
          selected
            ? 'bg-burgundy border-2 border-burgundy opacity-100'
            : 'bg-white/90 border-2 border-border opacity-0 group-hover:opacity-100 hover:border-burgundy'
        }`}
      >
        {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </button>

      <Link
        href={`/bishops/${bishop.slug}`}
        className={`block bg-white rounded-lg overflow-hidden border transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg ${
          selected ? 'border-burgundy shadow-md' : 'border-border shadow-sm'
        }`}
      >
        {/* Portrait — 3:4 aspect ratio, fills card width */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3 / 4' }}>
          {bishop.portraitUrl ? (
            <div className="absolute left-0 right-0 top-0 bottom-1.5 overflow-hidden">
              <Image
                src={bishop.portraitUrl}
                alt={`${cardName}, ${bishop.styleOfAddress}`}
                fill
                className="object-cover object-top"
                sizes="(min-width: 1280px) 15vw, (min-width: 1024px) 20vw, (min-width: 640px) 28vw, 45vw"
                priority={priority}
              />
            </div>
          ) : (
            <div className="absolute left-0 right-0 top-0 bottom-1.5 flex items-center justify-center bg-tag">
              <span
                className="font-display font-semibold text-text-tertiary select-none"
                style={{ fontSize: 'clamp(1.5rem, 5cqi, 2.5rem)' }}
                aria-hidden
              >
                {getInitials(cardName)}
              </span>
            </div>
          )}
          <div
            className="absolute left-0 right-0 bottom-0 z-10 h-1.5 rounded-b-lg"
            style={{ backgroundColor: stripeColor }}
            aria-hidden
          />
        </div>

        {/* Info */}
        <div className="px-3 py-2.5">
          {/* Style of address — italic, rank color */}
          <p className="font-display text-xs italic leading-snug" style={{ color: soaColor }}>
            {bishop.styleOfAddress}
          </p>
          {/* Name — Cormorant Garamond Medium, no color change */}
          <p className="font-display font-medium text-text-primary leading-snug text-sm mt-0.5">
            {cardName}
            {showStatus && (
              <span className="ml-1.5 font-body text-[11px] text-text-tertiary">
                {bishop.statusLabel}
              </span>
            )}
          </p>
          {/* Role title — text-secondary */}
          {roleTitle && (
            <p className="font-body text-xs text-text-secondary leading-snug mt-0.5">
              {roleTitle}
            </p>
          )}
          {/* Diocese name — text-secondary, wraps freely */}
          {bishop.currentAssignment && !isElectRole(bishop.currentAssignment.role) && (
            <p className="font-body text-xs text-text-secondary leading-snug mt-0.5">
              {bishop.currentAssignment.seeName}
            </p>
          )}
          {bishop.religiousOrderId && bishop.religiousOrderFullName && (
            <button
              type="button"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                router.push(`/bishops?religiousOrder=${bishop.religiousOrderId}`)
              }}
              className="block text-left font-body text-xs text-text-tertiary hover:text-burgundy leading-snug mt-1 transition-colors"
            >
              {bishop.religiousOrderFullName}
            </button>
          )}
        </div>
      </Link>
    </div>
  )
}
