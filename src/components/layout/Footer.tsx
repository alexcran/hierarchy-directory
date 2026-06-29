import Image from 'next/image'
import Link from 'next/link'

const NAV_COLUMNS = [
  {
    heading: 'Directory',
    links: [
      { href: '/dioceses', label: 'Dioceses' },
      { href: '/bishops', label: 'Bishops' },
      { href: '/build-directory', label: 'Build a Directory' },
    ],
  },
  {
    heading: 'About',
    links: [
      { href: '/about', label: 'About' },
      { href: '/about/data', label: 'Data Sources' },
      { href: '/contact', label: 'Contact' },
    ],
  },
]

export function Footer() {
  return (
    <footer style={{ backgroundColor: '#1A1714' }}>
      <div className="max-w-content mx-auto px-6">

        {/* ── Logo row ────────────────────────────────────── */}
        <div className="pt-10 pb-6">
          <Image
            src="/hierarchy-directory-logo-white.svg"
            alt="Hierarchy.Directory"
            width={300}
            height={95}
          />
        </div>

        {/* ── Divider below logo ──────────────────────────── */}
        <div style={{ borderTopColor: '#2A2520' }} className="border-t" />

        {/* ── Content row ─────────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-14 py-8">

          {/* Left ~35% — tagline block */}
          <div className="md:flex-1 md:max-w-[58%]">
            <div className="space-y-1.5 text-[14px] font-body text-[#9C958D] leading-relaxed">
              <p>A Visual Directory of the Hierarchy of the Catholic Church.</p>
              <p className="italic text-[#6B6560]">Currently featuring the bishops and dioceses of the United States.</p>
              <p>Dedicated to Mary, Queen of Apostles and the Immaculate Conception.</p>
              <p className="italic">Ora pro nobis!</p>
            </div>
            <p className="mt-4 text-[12px] font-body text-[#5A5550] leading-relaxed">
              Not affiliated with the USCCB, any (arch)diocese, or the Holy See.
            </p>
          </div>

          {/* Right ~65% — three nav columns */}
          <div className="md:w-[34%] grid grid-cols-2 gap-8 md:gap-12">
            {NAV_COLUMNS.map(({ heading, links }) => (
              <div
                key={heading}
                className={heading === 'About' ? 'md:justify-self-end' : undefined}
              >
                <h3 className="font-body font-semibold text-[#9C958D] text-[11px] uppercase tracking-widest mb-5">
                  {heading}
                </h3>
                <ul className="space-y-3">
                  {links.map(link => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[14px] font-body text-[#DDD8D0] no-underline hover:text-white hover:underline underline-offset-2 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom bar divider ──────────────────────────── */}
        <div style={{ borderTopColor: '#2A2520' }} className="border-t" />

        {/* ── Bottom bar ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
          <p className="text-[12px] font-body text-[#5A5550] leading-relaxed">
            Website, code, and design are copyright &copy; 2026 Hierarchy.Directory. All rights reserved.
            {' '}No ownership or copyright is claimed over images, portraits, or data.{' '}
            <Link
              href="/about/data"
              className="text-burgundy hover:text-scarlet transition-colors"
            >
              Learn more here.
            </Link>
          </p>
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link
              href="/privacy"
              className="text-[12px] font-body text-[#5A5550] hover:text-[#9C958D] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-[12px] font-body text-[#5A5550] hover:text-[#9C958D] transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
