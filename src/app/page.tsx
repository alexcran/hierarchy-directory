import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, FileSpreadsheet } from 'lucide-react'
import { HeroSearch } from '@/components/search/HeroSearch'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: {
    url: 'https://hierarchy.directory',
  },
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Hierarchy.Directory',
  url: 'https://hierarchy.directory',
  description: 'A visual directory of the hierarchy of the Catholic Church. Currently featuring the bishops and dioceses of the United States.',
}

function OrgChartIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="5" rx="1.5"/>
      <line x1="12" y1="7" x2="12" y2="10.5"/>
      <line x1="5" y1="10.5" x2="19" y2="10.5"/>
      <line x1="5" y1="10.5" x2="5" y2="13.5"/>
      <rect x="1" y="13.5" width="8" height="5" rx="1.5"/>
      <line x1="19" y1="10.5" x2="19" y2="13.5"/>
      <rect x="15" y="13.5" width="8" height="5" rx="1.5"/>
      <line x1="5" y1="18.5" x2="5" y2="20.5"/>
      <line x1="2.5" y1="20.5" x2="7.5" y2="20.5"/>
      <line x1="2.5" y1="20.5" x2="2.5" y2="22.5"/>
      <line x1="7.5" y1="20.5" x2="7.5" y2="22.5"/>
    </svg>
  )
}

const ENTRY_CARDS = [
  {
    href: '/dioceses',
    label: 'Browse Dioceses',
    desc: 'Navigate by metropolitan province to explore all dioceses and their current bishops.',
    icon: <OrgChartIcon />,
  },
  {
    href: '/bishops',
    label: 'Browse Bishops',
    desc: 'Filter by rank, rite, state, diocese, religious order, or consecration date.',
    icon: <Search size={30} strokeWidth={1.75} />,
  },
  {
    href: '/build-directory',
    label: 'Build a Directory',
    desc: 'Select bishops and generate a custom, printable PDF directory.',
    icon: <FileSpreadsheet size={30} strokeWidth={1.75} />,
  },
]

export default function HomePage() {
  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
    />
    <div
      className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center px-6 py-16"
      style={{
        backgroundImage: 'url(/mosaic-hero-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-3xl mx-auto text-center space-y-8">
        <div className="space-y-3">
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-text-primary leading-tight text-balance">
            A Visual Directory of the Hierarchy of the Catholic Church
          </h1>
          <p className="font-body text-lg text-text-secondary max-w-xl mx-auto pt-1">
            Current and historical information about the bishops and dioceses of the Catholic Church, currently featuring bishops and dioceses connected to the United States.
          </p>
        </div>

        <HeroSearch />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {ENTRY_CARDS.map(({ href, label, desc, icon }) => (
            <Link
              key={href}
              href={href}
              className="group p-6 bg-white/70 backdrop-blur-sm border border-border rounded-xl text-left hover:border-burgundy/40 hover:shadow-md transition-all duration-200"
            >
              <div className="text-burgundy mb-3">
                {icon}
              </div>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-1.5">{label}</h2>
              <p className="font-body text-sm text-text-secondary leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
    </>
  )
}
