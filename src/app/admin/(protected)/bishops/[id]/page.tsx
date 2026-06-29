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
import { isCurrentCardinal } from '@/lib/utils/personStatus'
import { type Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

const bishopEditInclude = {
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
} satisfies Prisma.PersonInclude

type BishopEditPerson = Prisma.PersonGetPayload<{ include: typeof bishopEditInclude }>

function fmtDate(d: Date | null): string {
  return d ? d.toISOString().split('T')[0] : ''
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const person = await prisma.person.findUnique({
    where: { id: params.id },
    select: { firstName: true, middleName: true, lastName: true, suffix: true, cardinalate: { select: { id: true, dateEnded: true } } },
  })
  if (!person) return { title: 'Bishop' }
  return { title: `${formatName(person, { isCardinal: isCurrentCardinal(person) })} — Admin` }
}

export default async function BishopEditPage({ params }: { params: { id: string } }) {
  const [person, religiousOrders] = await Promise.all([
  prisma.person.findUnique({
    where: { id: params.id },
    include: bishopEditInclude,
  }),
  prisma.religiousOrder.findMany({
    orderBy: { fullName: 'asc' },
    select: { id: true, fullName: true, abbreviation: true, commonName: true },
  }),
  ])

  if (!person) notFound()

  // Education records
  const typedPerson = person as BishopEditPerson

  const educationRecords: EducationRecord[] = typedPerson.education.map((e: BishopEditPerson['education'][number]) => ({
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
    id:                  typedPerson.id,
    firstName:           typedPerson.firstName,
    middleName:          typedPerson.middleName,
    lastName:            typedPerson.lastName,
    suffix:              typedPerson.suffix,
    religiousOrderId:    typedPerson.religiousOrder?.id ?? null,
    styleOfAddress:      typedPerson.styleOfAddress,
    dateOfBirth:         fmtDate(typedPerson.dateOfBirth),
    dateOfDeath:         fmtDate(typedPerson.dateOfDeath),
    laicizedDate:        fmtDate(typedPerson.laicizedDate),
    laicizationReason:   typedPerson.laicizationReason,
    placeOfBirth:        typedPerson.placeOfBirth,
    motto:               typedPerson.motto,
    catholicHierarchyId: typedPerson.catholicHierarchyId,
    gcatholicId:         typedPerson.gcatholicId,
    wikipediaUrl:        typedPerson.wikipediaUrl,
    diocesanBioUrl:      typedPerson.diocesanBioUrl,
  }

  // Assignments
  const assignmentRows: AssignmentRow[] = typedPerson.assignments.map((a: BishopEditPerson['assignments'][number]) => ({
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
  const ord = typedPerson.priesthoodOrdination
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
  const con = typedPerson.consecrations[0] ?? null
  const consecrationData: ConsecrationData | null = con ? {
    id:                       con.id,
    date:                     fmtDate(con.date),
    location:                 con.location ?? '',
    principalConsecratorId:   con.principalConsecratorId,
    principalConsecratorName: con.principalConsecrator ? formatName(con.principalConsecrator) : null,
    coConsecrators:           con.coConsecrators.map((cc: NonNullable<typeof con>['coConsecrators'][number]) => ({
      id:   cc.coConsecrator.id,
      name: formatName(cc.coConsecrator),
    })),
  } : null

  // Cardinalate
  const card = typedPerson.cardinalate
  const cardinalateData = card ? {
    dateCreated:   fmtDate(card.dateCreated),
    cardinalOrder: card.cardinalOrder,
    titularChurch: card.titularChurch ?? '',
    isElector:     card.isElector,
    dateEnded:     fmtDate(card.dateEnded),
    endReason:     card.endReason ?? '',
  } : null

  const vaticanEventRecords: VaticanEventRecord[] = typedPerson.vaticanEvents.map((e: BishopEditPerson['vaticanEvents'][number]) => ({
    id:          e.id,
    eventType:   e.eventType,
    eventDate:   fmtDate(e.eventDate),
    eventEndDate: e.eventEndDate ? fmtDate(e.eventEndDate) : null,
    description: e.description,
  }))

  return (
    <>
      <BreadcrumbSetter label={formatName(typedPerson, { isCardinal: isCurrentCardinal(typedPerson) })} />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/bishops" className="text-sm font-body text-text-tertiary hover:text-text-primary transition-colors">
            ← Bishops
          </Link>
          <span className="text-text-tertiary">/</span>
          <h1 className="font-display text-2xl font-semibold text-text-primary truncate">
            {formatName(typedPerson, { isCardinal: isCurrentCardinal(typedPerson) })}
          </h1>
        </div>
        <Link
          href={`/bishops/${typedPerson.slug}`}
          target="_blank"
          className="flex-shrink-0 text-sm font-body text-text-secondary hover:text-text-primary transition-colors"
        >
          View on site ↗
        </Link>
      </div>

      <div className="space-y-6">
        <BishopEditForm person={formData} religiousOrders={religiousOrders} />
        <PortraitUploader personId={typedPerson.id} currentUrl={typedPerson.portraitUrl} currentPhotoCredit={typedPerson.photoCredit} />
        <CardinalateEditor personId={typedPerson.id} initial={cardinalateData} />
        <AssignmentsEditor personId={typedPerson.id} initial={assignmentRows} />
        <OrdinationEditor personId={typedPerson.id} initial={ordinationData} />
        <ConsecrationEditor personId={typedPerson.id} initial={consecrationData} />
        <EducationEditor personId={typedPerson.id} initial={educationRecords} />
        <VaticanEventsEditor personId={typedPerson.id} initial={vaticanEventRecords} />
      </div>
    </>
  )
}
