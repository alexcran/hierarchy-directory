import prisma from '@/lib/prisma'
import { formatName } from '@/lib/utils/formatName'
import { isCurrentCardinal } from '@/lib/utils/personStatus'
import { AssignmentsClient, type AssignmentRow } from './AssignmentsClient'
import { type Prisma } from '@prisma/client'

export const metadata = { title: 'Assignments — Admin' }
export const dynamic = 'force-dynamic'

const assignmentInclude = {
  person: {
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      suffix: true,
      religiousOrder: true,
      portraitUrl: true,
      cardinalate: { select: { id: true, dateEnded: true } },
    },
  },
  see: { select: { name: true } },
} satisfies Prisma.AssignmentInclude

type AdminAssignment = Prisma.AssignmentGetPayload<{ include: typeof assignmentInclude }>

export default async function AdminAssignmentsPage() {
  const assignments: AdminAssignment[] = await prisma.assignment.findMany({
    orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
    include: assignmentInclude,
  })

  const rows: AssignmentRow[] = assignments.map((a: AdminAssignment) => ({
    id:          a.id,
    personId:    a.personId,
    personName:  formatName(a.person, { honorific: false, isCardinal: isCurrentCardinal(a.person) }),
    portraitUrl: a.person.portraitUrl,
    isCardinal:  isCurrentCardinal(a.person),
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
