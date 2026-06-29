'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { useSelection } from '@/contexts/SelectionContext'
import { BishopPortrait } from '@/components/bishop/BishopPortrait'
import type { TypeaheadResult } from '@/lib/queries/search'

interface NavItem {
  href: string
  label: string
  dropdown?: { label: string; href: string }[]
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dioceses',
    label: 'Dioceses',
    dropdown: [
      { label: 'All Dioceses', href: '/dioceses' },
      { label: 'By Province', href: '/dioceses?view=province' },
      { label: 'By State', href: '/dioceses?view=state' },
    ],
  },
  {
    href: '/bishops',
    label: 'Bishops',
    dropdown: [
      { label: 'Living Bishops', href: '/bishops' },
      { label: 'All Bishops', href: '/bishops?status=all' },
      { label: 'Cardinals', href: '/bishops?rank=cardinal' },
      { label: 'Archbishops', href: '/bishops?rank=archbishop' },
      { label: 'By Religious Order', href: '/bishops' },
      { label: 'Resignation Pending', href: '/bishops?status=resignation_pending' },
      { label: 'Recently Appointed', href: '/bishops' },
    ],
  },
  {
    href: '/build-directory',
    label: 'Build a Directory',
  },
]

function SearchDropdown({ results, onBishop, onDiocese }: {
  results: TypeaheadResult
  onBishop: (id: string, slug: string) => void
  onDiocese: (id: string, slug: string) => void
}) {
  const hasResults = results.bishops.length > 0 || results.dioceses.length > 0
  if (!hasResults) return null

  return (
    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-border rounded-xl shadow-lg overflow-hidden z-50">
      {results.bishops.length > 0 && (
        <div>
          <div className="px-3 py-1.5 text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide bg-surface/60">
            Bishops
          </div>
          {results.bishops.map(b => (
            <button
              key={b.id}
              onMouseDown={() => onBishop(b.id, b.slug)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface text-left transition-colors"
            >
              <BishopPortrait
                src={b.portraitUrl}
                name={b.name}
                width={28}
                height={28}
                rankColor={b.isCardinal ? '#C41E3A' : '#007A00'}
                barHeight={4}
              />
              <div className="min-w-0">
                <div className="text-sm font-body text-text-primary truncate">{b.name}</div>
                {b.title && <div className="text-xs text-text-tertiary truncate">{b.title}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
      {results.dioceses.length > 0 && (
        <div>
          <div className="px-3 py-1.5 text-xs font-body font-semibold text-text-tertiary uppercase tracking-wide bg-surface/60">
            Dioceses
          </div>
          {results.dioceses.map(d => (
            <button
              key={d.id}
              onMouseDown={() => onDiocese(d.id, d.slug)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface text-left transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-body text-text-primary truncate">{d.name}</div>
                {d.country && <div className="text-xs text-text-tertiary truncate">{d.country}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function NavDropdown({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  function show() {
    clearTimeout(timerRef.current)
    setOpen(true)
  }

  function hide() {
    timerRef.current = setTimeout(() => setOpen(false), 80)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  if (!item.dropdown) {
    return (
      <Link
        href={item.href}
        className="px-3 py-1.5 text-sm font-body rounded-md whitespace-nowrap transition-colors text-text-secondary hover:text-text-primary hover:bg-surface"
      >
        {item.label}
      </Link>
    )
  }

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <Link
        href={item.href}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-body rounded-md whitespace-nowrap transition-colors text-text-secondary hover:text-text-primary hover:bg-surface"
      >
        {item.label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Link>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg py-1 min-w-[180px] z-50">
          {item.dropdown.map(({ label, href }) => (
            <Link
              key={href + label}
              href={href}
              className="block px-4 py-1.5 text-sm font-body text-text-primary hover:text-burgundy hover:bg-surface transition-colors whitespace-nowrap"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function TopBar() {
  const router = useRouter()
  const pathname = usePathname()
  const { count } = useSelection()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TypeaheadResult | null>(null)
  const [open, setOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null)
      setOpen(false)
      return
    }
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then((data: TypeaheadResult) => {
        setResults(data)
        const has = data.bishops.length > 0 || data.dioceses.length > 0
        setOpen(has)
      })
      .catch(() => {})
  }, [debouncedQuery])

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setOpen(false)
  }, [pathname])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
    if (e.key === 'Enter' && query.trim()) {
      setOpen(false)
      router.push(`/bishops?search=${encodeURIComponent(query.trim())}`)
    }
  }

  function navigate(path: string) {
    setOpen(false)
    setQuery('')
    router.push(path)
  }

  const isHome = pathname === '/'
  const headerHeightClass = isHome ? 'h-16' : 'h-24 md:h-16'
  const search = !isHome && (
    <div className="order-last md:order-none w-full md:flex-1 md:min-w-0 md:flex md:justify-center pb-3 md:pb-0 md:px-2 lg:px-4">
      <div ref={containerRef} className="relative w-full md:max-w-sm">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            placeholder="Search bishops, dioceses..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results && setOpen(true)}
            onKeyDown={handleKeyDown}
            className="w-full h-9 pl-9 pr-3 text-sm font-body bg-surface border border-border rounded-full placeholder:text-text-tertiary text-text-primary focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
          />
        </div>
        {open && results && (
          <SearchDropdown
            results={results}
            onBishop={(_id, slug) => navigate(`/bishops/${slug}`)}
            onDiocese={(_id, slug) => navigate(`/dioceses/${slug}`)}
          />
        )}
      </div>
    </div>
  )

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 ${headerHeightClass} bg-white border-b border-border`}>
        <div className="relative h-full max-w-content mx-auto px-4 sm:px-6 flex flex-wrap md:flex-nowrap items-center gap-x-3">
          <Link href="/" className="h-12 md:h-auto flex items-center flex-shrink-0">
            <Image
              src="/hierarchy-directory-logo.svg"
              alt="Hierarchy.Directory"
              width={113}
              height={36}
              priority
            />
          </Link>

          {search}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(v => !v)}
            className="ml-auto inline-flex lg:hidden items-center justify-center w-10 h-10 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="hidden lg:flex items-center gap-1 flex-shrink-0 ml-auto">
            <nav className="flex items-center gap-0.5">
              {NAV_ITEMS.map(item => (
                <NavDropdown key={item.href} item={item} />
              ))}
            </nav>

            {count > 0 && (
              <Link
                href="/build-directory"
                className="ml-2 flex items-center gap-1.5 px-3 py-1.5 text-sm font-body font-semibold text-burgundy bg-burgundy/10 rounded-md hover:bg-burgundy/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                {count}
              </Link>
            )}
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden absolute left-0 right-0 top-full bg-white border-b border-border shadow-lg">
            <nav className="max-w-content mx-auto px-4 sm:px-6 py-3">
              {NAV_ITEMS.map(item => (
                <div key={item.href} className="border-b border-border last:border-b-0 py-2">
                  <Link
                    href={item.href}
                    className="block py-2 text-base font-body font-semibold text-text-primary"
                  >
                    {item.label}
                  </Link>
                  {item.dropdown && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pb-1">
                      {item.dropdown.map(({ label, href }) => (
                        <Link
                          key={href + label}
                          href={href}
                          className="block rounded-md px-3 py-2 text-sm font-body text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {count > 0 && (
                <Link
                  href="/build-directory"
                  className="mt-3 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-body font-semibold text-burgundy bg-burgundy/10 rounded-md"
                >
                  {count} {count === 1 ? 'bishop' : 'bishops'} selected
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>
      <div aria-hidden="true" className={headerHeightClass} />
    </>
  )
}
