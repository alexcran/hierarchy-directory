import { notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatName } from '@/lib/utils/formatName'
import { BishopEditForm } from './BishopEditForm'
import { PortraitUploader } from './PortraitUploader'
import { CardinalateEditor } from './CardinalateEditor'
import { AssignmentsEditor, type AssignmentRow } from './AssignmentsEditor'
import { OrdinationEditor, type OrdinationData } from './OrdinationEditor'
import { ConsecrationEditor, type ConsecrationData } from './ConsecrationEditor'
import { EducationEditor, type EducationRecord } from './EducationEditor'
import { VaticanEventsEditor, type VaticanEventRecord } from './VaticanEventsEditor'
import { BreadcrumbSetter } from '@/components/admin/BreadcrumbSetter'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null): string {
  return d ? d.toISOString().split('T')[0] : ''
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const person = await prisma.person.findUnique({
    where: { id: params.id },
    select: { firstName: true, middleName: true, lastName: true, suffix: true, cardinalate: { select: { id: true } } },
  })
  if (!person) return { title: 'Bishop' }
  return { title: `${formatName(person, { isCardinal: !!person.cardinalate })} — Admin` }
}

export default async function BishopEditPage({ params }: { params: { id: string } }) {
  const [person, religiousOrders] = await Promise.all([
  prisma.person.findUnique({
    where: { id: params.id },
    include: {
      cardinalate: true,
      religiousOrder: { select: { id: true, abbreviation: true } },
      assignments: {
        orderBy: { startDate: 'desc' },
        include: { see: { select: { id: true, name: true, seeType: true } } },
      },
      priesthoodOrdination: {
        include: {
          ordainingBishop:  { select: { id: true, firstName: true, middleName: true, lastName: true, suffix: true } },
          incardinationSee: { select: { id: true, name: true } },
          ordinationSee:    { select: { id: true, name: true } },
        },
      },
      education: {
        orderBy: { ordinal: 'asc' },
      },
      vaticanEvents: {
        orderBy: { eventDate: 'desc' },
      },
      consecrations: {
        orderBy: { date: 'desc' },
        take: 1,
        include: {
          principalConsecrator: { select: { id: true, firstName: true, middleName: true, lastName: true, suffix: true } },
          coConsecrators: {
            orderBy: { ordinal: 'asc' },
            include: {
              coConsecrator: { select: { id: true, firstName: true, middleName: true, lastName: true, suffix: true } },
            },
          },
        },
      },
    },
  }),
  prisma.religiousOrder.findMany({
    orderBy: { fullName: 'asc' },
    select: { id: true, fullName: true, abbreviation: true, commonName: true },
  }),
  ])

  if (!person) notFound()

  // Education records
  const educationRecords: EducationRecord[] = person.education.map(e => ({
    id:           e.id,
    institution:  e.institution,
    degree:       e.degree ?? '',
    fieldOfStudy: e.fieldOfStudy ?? '',
    startYear:    e.startYear?.toString() ?? '',
    endYear:      e.endYear?.toString() ?? '',
    ordinal:      e.ordinal,
  }))

  // Basic form data
  const formData: Record<string, string | null> = {
    id:                  person.id,
    firstName:           person.firstName,
    middleName:          person.middleName,
    lastName:            person.lastName,
    suffix:              person.suffix,
    religiousOrderId:    person.religiousOrder?.id ?? null,
    styleOfAddress:      person.styleOfAddress,
    dateOfBirth:         fmtDate(person.dateOfBirth),
    dateOfDeath:         fmtDate(person.dateOfDeath),
    placeOfBirth:        person.placeOfBirth,
    motto:               person.motto,
    catholicHierarchyId: person.catholicHierarchyId,
    gcatholicId:         person.gcatholicId,
    wikipediaUrl:        person.wikipediaUrl,
    diocesanBioUrl:      person.diocesanBioUrl,
  }

  // Assignments
  const assignmentRows: AssignmentRow[] = person.assignments.map(a => ({
    id:            a.id,
    seeId:         a.see.id,
    seeName:       a.see.name,
    role:          a.role,
    titleOverride: a.titleOverride,
    startDate:     fmtDate(a.startDate),
    installedDate: fmtDate(a.installedDate ?? null),
    endDate:       fmtDate(a.endDate ?? null),
    startReason:   a.startReason,
    endReason:     a.endReason,
    isCurrent:     a.isCurrent,
  }))

  // Ordination
  const ord = person.priesthoodOrdination
  const ordinationData: OrdinationData | null = ord ? {
    date:                          fmtDate(ord.date),
    location:                      ord.location ?? '',
    ordainingBishopId:             ord.ordainingBishopId,
    ordainingBishopName:           ord.ordainingBishop ? formatName(ord.ordainingBishop) : null,
    incardinationSeeId:            ord.incardinationSeeId,
    incardinationSeeName:          ord.incardinationSee?.name ?? null,
    ordinationSeeId:               ord.ordinationSeeId,
    ordinationSeeName:             ord.ordinationSee?.name ?? null,
    religiousInstituteAtOrdination: ord.religiousInstituteAtOrdination ?? null,
  } : null

  // Consecration
  const con = person.consecrations[0] ?? null
  const consecrationData: ConsecrationData | null = con ? {
    id:                       con.id,
    date:                     fmtDate(con.date),
    location:                 con.location ?? '',
    principalConsecratorId:   con.principalConsecratorId,
    principalConsecratorName: con.principalConsecrator ? formatName(con.principalConsecrator) : null,
    coConsecrators:           con.coConsecrators.map(cc => ({
      id:   cc.coConsecrator.id,
      name: formatName(cc.coConsecrator),
    })),
  } : null

  // Cardinalate
  const card = person.cardinalate
  const cardinalateData = card ? {
    dateCreated:   fmtDate(card.dateCreated),
    cardinalOrder: card.cardinalOrder,
    titularChurch: card.titularChurch ?? '',
    isElector:     card.isElector,
  } : null

  const vaticanEventRecords: VaticanEventRecord[] = person.vaticanEvents.map(e => ({
    id:          e.id,
    eventType:   e.eventType,
    eventDate:   fmtDate(e.eventDate),
    eventEndDate: e.eventEndDate ? fmtDate(e.eventEndDate) : null,
    description: e.description,
  }))

  return (
    <>
      <BreadcrumbSetter label={formatName(person, { isCardinal: !!person.cardinalate })} />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/bishops" className="text-sm font-body text-text-tertiary hover:text-text-primary transition-colors">
            ← Bishops
          </Link>
          <span className="text-text-tertiary">/</span>
          <h1 className="font-display text-2xl font-semibold text-text-primary truncate">
            {formatName(person, { isCardinal: !!person.cardinalate })}
          </h1>
        </div>
        <Link
          href={`/bishops/${person.slug}`}
          target="_blank"
          className="flex-shrink-0 text-sm font-body text-text-secondary hover:text-text-primary transition-colors"
        >
          View on site ↗
        </Link>
      </div>

      <div className="space-y-6">
        <BishopEditForm person={formData} religiousOrders={religiousOrders} />
        <PortraitUploader personId={person.id} currentUrl={person.portraitUrl} currentPhotoCredit={person.photoCredit} />
        <CardinalateEditor personId={person.id} initial={cardinalateData} />
        <AssignmentsEditor personId={person.id} initial={assignmentRows} />
        <OrdinationEditor personId={person.id} initial={ordinationData} />
        <ConsecrationEditor personId={person.id} initial={consecrationData} />
        <EducationEditor personId={person.id} initial={educationRecords} />
        <VaticanEventsEditor personId={person.id} initial={vaticanEventRecords} />
      </div>
    </>
  )
}
