'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton } from '@/components/admin/SignOutButton'

const TABS = [
  { href: '/admin',          label: 'Dashboard', exact: true },
  { href: '/admin/bishops',  label: 'Bishops' },
  { href: '/admin/dioceses', label: 'Dioceses' },
  { href: '/admin/quality',  label: 'Quality' },
  { href: '/admin/settings', label: 'Settings' },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <div className="border-b border-border flex items-end justify-between">
      <nav className="flex items-end gap-0 -mb-px">
        {TABS.map(({ href, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2.5 text-sm font-body border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-burgundy text-burgundy font-semibold'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="pb-2.5">
        <SignOutButton />
      </div>
    </div>
  )
}
