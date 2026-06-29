import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'
import { convertElectRole, ELECT_ROLES } from '@/lib/utils/roles'
import { formatName } from '@/lib/utils/formatName'
import { formatSeeName } from '@/lib/utils/formatSeeName'
import { formatRoleTitle } from '@/lib/utils/formatTitle'
import { isCurrentCardinal } from '@/lib/utils/personStatus'

export const dynamic = 'force-dynamic'

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.get('authorization') === `Bearer ${cronSecret}`) return true
  if (req.headers.get('x-vercel-cron') === '1') return true
  const { error } = await adminAuthCheck()
  return !error
}

async function ensureActivityTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS admin_activity (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      href TEXT NOT NULL,
      badge TEXT NOT NULL,
      badge_style TEXT NOT NULL,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at ON admin_activity(created_at DESC)
  `
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureActivityTable()

  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const assignments = await prisma.assignment.findMany({
    where: {
      role: { in: [...ELECT_ROLES] },
      installedDate: { lte: today },
    },
    include: {
      person: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          suffix: true,
          religiousOrder: { select: { abbreviation: true } },
          cardinalate: { select: { id: true, dateEnded: true } },
        },
      },
      see: { select: { id: true, slug: true, name: true, seeType: true, namePrefixOverride: true } },
    },
  })

  const conversions = []

  for (const assignment of assignments) {
    const oldRole = assignment.role
    const nextRole = convertElectRole(oldRole)
    if (nextRole === oldRole) continue

    const seeName = formatSeeName(assignment.see.name, assignment.see.seeType, assignment.see.namePrefixOverride)
    const personName = formatName(assignment.person, { honorific: false, isCardinal: isCurrentCardinal(assignment.person) })
    const oldTitle = formatRoleTitle(oldRole, seeName)
    const newTitle = formatRoleTitle(nextRole, seeName)
    const installed = assignment.installedDate?.toISOString().slice(0, 10) ?? ''
    const label = `Auto-converted ${personName} from ${oldTitle} to ${newTitle} (installed ${installed})`

    await prisma.$transaction([
      prisma.assignment.update({
        where: { id: assignment.id },
        data: { role: nextRole, isCurrent: true },
      }),
      prisma.$executeRaw`
        INSERT INTO admin_activity (id, label, href, badge, badge_style, created_at)
        VALUES (${randomUUID()}, ${label}, ${`/admin/bishops/${assignment.person.id}`}, 'Auto', 'bg-purple-50 text-purple-700', now())
      `,
    ])

    conversions.push({ assignmentId: assignment.id, personName, oldRole, newRole: nextRole, installedDate: installed })
  }

  return NextResponse.json({ ok: true, conversions })
}

export async function POST(req: NextRequest) {
  return GET(req)
}
