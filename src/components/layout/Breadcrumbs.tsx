'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useBreadcrumb } from '@/contexts/BreadcrumbContext'

const SEGMENT_LABELS: Record<string, string> = {
  bishops: 'Bishops',
  dioceses: 'Dioceses',
  'build-directory': 'Build a Directory',
  admin: 'Admin',
  assignments: 'Assignments',
}

const HIDDEN_PATHS = new Set([
  '/',
  '/about',
  '/about/data',
  '/bishops',
  '/build-directory',
  '/contact',
  '/dioceses',
  '/privacy',
  '/terms',
])

function segmentToLabel(seg: string): string {
  return SEGMENT_LABELS[seg] ?? seg.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const { overrideLabel } = useBreadcrumb()
  if (HIDDEN_PATHS.has(pathname)) return null

  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] === 'admin' && segments.length < 3) return null

  const crumbs: { label: string; href: string }[] = [{ label: 'Home', href: '/' }]
  let built = ''
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    built += `/${seg}`
    const isLast = i === segments.length - 1
    // For the last dynamic segment (detail page), use the override label if set
    const label = (isLast && overrideLabel) ? overrideLabel : segmentToLabel(seg)
    crumbs.push({ label, href: built })
  }

  return (
    <div className="border-b border-border">
      <div className="max-w-content mx-auto px-6 py-2.5">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm font-body text-text-secondary flex-wrap">
          {crumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1">
              {i > 0 && (
                <svg className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {i === crumbs.length - 1 ? (
                <span className="text-text-primary font-medium">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-text-primary transition-colors">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>
    </div>
  )
}
