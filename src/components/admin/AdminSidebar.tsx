'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Church,
  Briefcase,
  Star,
  Upload,
  ClipboardCheck,
} from 'lucide-react'

const NAV = [
  { href: '/admin',              label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { href: '/admin/bishops',      label: 'Bishops',       icon: Users },
  { href: '/admin/dioceses',     label: 'Dioceses',      icon: Church },
  { href: '/admin/assignments',  label: 'Assignments',   icon: Briefcase },
  { href: '/admin/consecrations',label: 'Consecrations', icon: Star },
  { href: '/admin/quality',      label: 'Quality',       icon: ClipboardCheck },
  { href: '/admin/import',       label: 'Import',        icon: Upload },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-52 bg-white border-r border-border flex-shrink-0 flex flex-col min-h-screen">
      {/* Wordmark */}
      <div className="px-5 py-5 border-b border-border">
        <p className="font-display text-xl font-semibold text-text-primary leading-none">hierarchy</p>
        <p className="font-body text-xs text-text-tertiary">.directory</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-body transition-colors ${
                active
                  ? 'bg-burgundy/10 text-burgundy font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
