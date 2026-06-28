import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatName } from '@/lib/utils/formatName'
import { BishopListClient, type BishopRow } from './BishopListClient'

export const dynamic = 'force-dynamic'

function getRank(
  cardinalate: { id: string } | null,
  assignments: Array<{ role: string; see: { seeType: string } }>,
): 'Cardinal' | 'Archbishop' | 'Bishop' {
  if (cardinalate) return 'Cardinal'
  const a = assignments[0]
  if (a && a.see.seeType === 'archdiocese' && a.role !== 'auxiliary') return 'Archbishop'
  return 'Bishop'
}


export default async function AdminBishopsPage() {
  const persons = await prisma.person.findMany({
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      suffix: true,
      religiousOrder: true,
      portraitUrl: true,
      slug: true,
      updatedAt: true,
      cardinalate: { select: { id: true } },
      assignments: {
        where: { isCurrent: true },
        select: { role: true, see: { select: { name: true, seeType: true } } },
        take: 1,
        orderBy: { startDate: 'desc' },
      },
    },
  })

  const rows: BishopRow[] = persons.map(p => ({
    id: p.id,
    slug: p.slug,
    displayName: formatName(p, { honorific: false, isCardinal: !!p.cardinalate }),
    rank: getRank(p.cardinalate, p.assignments),
    portraitUrl: p.portraitUrl,
    currentSee: p.assignments[0]?.see.name ?? null,
    currentRole: p.assignments[0]?.role ?? null,
    updatedAt: p.updatedAt.toISOString(),
  }))

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Bishops</h1>
        <Link
          href="/admin/bishops/new"
          className="px-4 py-2 bg-burgundy text-white text-sm font-body font-semibold rounded-lg hover:bg-burgundy/90 transition-colors"
        >
          Add New Bishop
        </Link>
      </div>
      <BishopListClient bishops={rows} />
    </>
  )
}
