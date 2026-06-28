import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'

function makeSlug(firstName: string, lastName: string): string {
  return `${firstName}-${lastName}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(req: NextRequest) {
  const { error } = await adminAuthCheck()
  if (error) return error

  const body = await req.json()
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
  const lastName  = typeof body.lastName  === 'string' ? body.lastName.trim()  : ''

  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'firstName and lastName are required' }, { status: 400 })
  }

  // Ensure unique slug
  const baseSlug = makeSlug(firstName, lastName)
  let slug = baseSlug
  let n = 1
  while (await prisma.person.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${n++}`
  }

  // Default to the Latin rite — required field on Person
  const latinRite = await prisma.rite.findFirst({ where: { type: 'latin' }, select: { id: true } })
  if (!latinRite) return NextResponse.json({ error: 'Default rite not found' }, { status: 500 })

  const person = await prisma.person.create({
    data: {
      firstName,
      lastName,
      slug,
      riteId:         latinRite.id,
      middleName:     body.middleName     ? String(body.middleName).trim()     : null,
      suffix:         body.suffix         ? String(body.suffix).trim()         : null,
      religiousOrderId: body.religiousOrderId || null,
    },
  })

  return NextResponse.json({ id: person.id, slug: person.slug }, { status: 201 })
}
