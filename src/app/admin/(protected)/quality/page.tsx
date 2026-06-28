import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatName } from '@/lib/utils/formatName'

export const dynamic = 'force-dynamic'

const ORDINARY_ROLES = new Set(['ordinary', 'diocesan_bishop', 'archbishop'])

function seeLabel(see: { name: string; seeType: string }) {
  const prefix = see.seeType === 'archdiocese' ? 'Archdiocese of' : 'Diocese of'
  return `${prefix} ${see.name}`
}

function QualitySection({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-body text-sm font-semibold text-text-primary">{title}</h2>
        <span className="font-body text-xs font-semibold text-text-secondary bg-surface border border-border rounded-full px-2.5 py-1">
          {count}
        </span>
      </div>
      {children}
    </section>
  )
}

function EmptyState() {
  return <p className="px-6 py-5 font-body text-sm text-text-tertiary">No issues found.</p>
}

export default async function AdminQualityPage() {
  const [peopleWithCurrentAssignments, sees, missingPortraits, missingCredits] = await Promise.all([
    prisma.person.findMany({
      where: { assignments: { some: { isCurrent: true } } },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        suffix: true,
        religiousOrder: true,
        cardinalate: { select: { id: true } },
        assignments: {
          where: { isCurrent: true },
          orderBy: { startDate: 'desc' },
          select: {
            id: true,
            role: true,
            see: { select: { id: true, name: true, seeType: true } },
          },
        },
      },
    }),
    prisma.see.findMany({
      where: { dateSuppressed: null },
      orderBy: [{ seeType: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        seeType: true,
        assignments: {
          where: { isCurrent: true },
          orderBy: { startDate: 'desc' },
          select: {
            id: true,
            role: true,
            person: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
                suffix: true,
                religiousOrder: true,
                cardinalate: { select: { id: true } },
              },
            },
          },
        },
      },
    }),
    prisma.person.findMany({
      where: { portraitUrl: null },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: 100,
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        suffix: true,
        religiousOrder: true,
        cardinalate: { select: { id: true } },
      },
    }),
    prisma.person.findMany({
      where: {
        portraitUrl: { not: null },
        OR: [{ photoCredit: null }, { photoCredit: '' }],
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: 100,
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        suffix: true,
        religiousOrder: true,
        cardinalate: { select: { id: true } },
      },
    }),
  ])

  const peopleWithDuplicateCurrentAssignments = peopleWithCurrentAssignments.filter((person) => person.assignments.length > 1)
  const seesWithDuplicateCurrentOrdinaries = sees
    .map((see) => ({
      ...see,
      ordinaries: see.assignments.filter((assignment) => ORDINARY_ROLES.has(assignment.role)),
    }))
    .filter((see) => see.ordinaries.length > 1)

  const seesMissingCurrentOrdinary = sees
    .map((see) => ({
      ...see,
      ordinaries: see.assignments.filter((assignment) => ORDINARY_ROLES.has(assignment.role)),
    }))
    .filter((see) => see.ordinaries.length === 0)

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Data Quality</h1>
        <p className="font-body text-sm text-text-secondary mt-2 max-w-2xl">
          Review records that need cleanup before launch: conflicting current assignments, missing portraits,
          missing image credits, and dioceses without a current ordinary.
        </p>
      </div>

      <div className="space-y-6">
        <QualitySection title="People With Multiple Current Assignments" count={peopleWithDuplicateCurrentAssignments.length}>
          {peopleWithDuplicateCurrentAssignments.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y divide-border">
              {peopleWithDuplicateCurrentAssignments.map((person) => (
                <li key={person.id} className="px-6 py-4">
                  <Link href={`/admin/bishops/${person.id}`} className="font-body text-sm font-semibold text-burgundy hover:underline">
                    {formatName(person, { honorific: false, isCardinal: !!person.cardinalate })}
                  </Link>
                  <p className="font-body text-xs text-text-tertiary mt-1">
                    {person.assignments.map((assignment) => `${assignment.role} - ${seeLabel(assignment.see)}`).join('; ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </QualitySection>

        <QualitySection title="Sees With Multiple Current Ordinaries" count={seesWithDuplicateCurrentOrdinaries.length}>
          {seesWithDuplicateCurrentOrdinaries.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y divide-border">
              {seesWithDuplicateCurrentOrdinaries.map((see) => (
                <li key={see.id} className="px-6 py-4">
                  <Link href={`/admin/dioceses/${see.id}`} className="font-body text-sm font-semibold text-burgundy hover:underline">
                    {seeLabel(see)}
                  </Link>
                  <p className="font-body text-xs text-text-tertiary mt-1">
                    {see.ordinaries.map((assignment) => formatName(assignment.person, { honorific: false, isCardinal: !!assignment.person.cardinalate })).join('; ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </QualitySection>

        <QualitySection title="Missing Portraits" count={missingPortraits.length}>
          {missingPortraits.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y divide-border">
              {missingPortraits.map((person) => (
                <li key={person.id} className="px-6 py-3">
                  <Link href={`/admin/bishops/${person.id}`} className="font-body text-sm text-burgundy hover:underline">
                    {formatName(person, { honorific: false, isCardinal: !!person.cardinalate })}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </QualitySection>

        <QualitySection title="Missing Portrait Credits" count={missingCredits.length}>
          {missingCredits.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y divide-border">
              {missingCredits.map((person) => (
                <li key={person.id} className="px-6 py-3">
                  <Link href={`/admin/bishops/${person.id}`} className="font-body text-sm text-burgundy hover:underline">
                    {formatName(person, { honorific: false, isCardinal: !!person.cardinalate })}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </QualitySection>

        <QualitySection title="Missing Current Ordinary" count={seesMissingCurrentOrdinary.length}>
          {seesMissingCurrentOrdinary.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y divide-border">
              {seesMissingCurrentOrdinary.map((see) => (
                <li key={see.id} className="px-6 py-3">
                  <Link href={`/admin/dioceses/${see.id}`} className="font-body text-sm text-burgundy hover:underline">
                    {seeLabel(see)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </QualitySection>
      </div>
    </>
  )
}
