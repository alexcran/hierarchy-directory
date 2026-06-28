import prisma from '@/lib/prisma'
import { formatName } from '@/lib/utils/formatName'
import { AssignmentsClient, type AssignmentRow } from './AssignmentsClient'

export const metadata = { title: 'Assignments — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminAssignmentsPage() {
  const assignments = await prisma.assignment.findMany({
    orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
    include: {
      person: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          suffix: true,
          religiousOrder: true,
          portraitUrl: true,
          cardinalate: { select: { id: true } },
        },
      },
      see: { select: { name: true } },
    },
  })

  const rows: AssignmentRow[] = assignments.map(a => ({
    id:          a.id,
    personId:    a.personId,
    personName:  formatName(a.person, { honorific: false, isCardinal: !!a.person.cardinalate }),
    portraitUrl: a.person.portraitUrl,
    isCardinal:  !!a.person.cardinalate,
    seeName:     a.see.name,
    role:        a.role,
    startDate:   a.startDate.toISOString().slice(0, 10),
    endDate:     a.endDate ? a.endDate.toISOString().slice(0, 10) : null,
    isCurrent:   a.isCurrent,
  }))

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Assignments</h1>
          <p className="font-body text-sm text-text-secondary mt-0.5">
            Review and navigate to bishop records to edit assignments.
          </p>
        </div>
      </div>
      <AssignmentsClient assignments={rows} />
    </>
  )
}
