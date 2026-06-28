import Image from 'next/image'
import { getInitials } from '@/lib/utils/getInitials'

interface BishopPortraitProps {
  src: string | null
  name: string
  width: number
  height: number
  rankColor?: string
  barHeight?: number
  photoCredit?: string | null
  className?: string
  priority?: boolean
}

export function BishopPortrait({
  src,
  name,
  width,
  height,
  rankColor,
  barHeight,
  photoCredit,
  className = '',
  priority = false,
}: BishopPortraitProps) {
  const initials = getInitials(name)
  const fontSize = Math.max(16, Math.round(height * 0.22))
  const stripHeight = rankColor ? (barHeight ?? Math.max(4, Math.round(height * 0.025))) : 0

  const totalHeight = height + stripHeight
  const baseClass = `relative overflow-hidden rounded-lg border border-border flex-shrink-0 bg-tag ${className}`
  const shadow = '0 2px 8px rgba(26, 23, 20, 0.08)'
  const bottomBar = rankColor ? (
    <div
      className="absolute left-0 right-0 bottom-0 z-10 flex items-center justify-center px-2 rounded-b-[inherit]"
      style={{ height: stripHeight, backgroundColor: rankColor }}
      aria-hidden={!photoCredit}
    >
      {photoCredit && (
        <span className="font-body text-white leading-none truncate" style={{ fontSize: Math.max(9, Math.min(12, stripHeight * 0.42)) }}>
          Photo: {photoCredit}
        </span>
      )}
    </div>
  ) : null

  if (src) {
    return (
      <div className={baseClass} style={{ width, height: totalHeight, boxShadow: shadow }}>
        <div className="absolute left-0 right-0 top-0 overflow-hidden" style={{ height }}>
          <Image
            src={src}
            alt={name}
            fill
            className="object-cover object-top"
            sizes={`${width}px`}
            priority={priority}
          />
        </div>
        {bottomBar}
      </div>
    )
  }

  return (
    <div
      className={`${baseClass} flex items-start justify-center`}
      style={{ width, height: totalHeight, boxShadow: shadow }}
      aria-label={name}
    >
      <div className="flex items-center justify-center" style={{ width, height }}>
        <span
          className="font-display font-semibold text-text-tertiary select-none leading-none"
          style={{ fontSize }}
          aria-hidden
        >
          {initials}
        </span>
      </div>
      {bottomBar}
    </div>
  )
}
