import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'

export async function GET() {
  const { error } = await adminAuthCheck()
  if (error) return error

  const rows = await prisma.education.findMany({
    select:  { institution: true },
    distinct: ['institution'],
    orderBy:  { institution: 'asc' },
  })

  return NextResponse.json(rows.map(r => r.institution))
}
