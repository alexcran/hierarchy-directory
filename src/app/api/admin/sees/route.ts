import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuthCheck } from '@/lib/admin-auth'
import { slugify } from '@/lib/utils/slugify'

async function uniqueSeeSlug(name: string) {
  const base = slugify(name) || 'see'
  let slug = base
  let i = 2
  while (await prisma.see.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${i}`
    i += 1
  }
  return slug
}

export async function POST(req: NextRequest) {
  const { error } = await adminAuthCheck()
  if (error) return error

  const body = await req.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const seeType = typeof body.seeType === 'string' ? body.seeType.trim() : ''
  const riteName = typeof body.riteName === 'string' && body.riteName.trim()
    ? body.riteName.trim()
    : 'Latin'
  const countryName = typeof body.countryName === 'string' ? body.countryName.trim() : ''
  const countryIsoCode = typeof body.countryIsoCode === 'string' ? body.countryIsoCode.trim().toUpperCase() : ''

  if (!name || !seeType) {
    return NextResponse.json({ error: 'Name and see type are required' }, { status: 400 })
  }

  if (countryName && !countryIsoCode) {
    return NextResponse.json({ error: 'Country ISO code is required when creating a country' }, { status: 400 })
  }

  const rite = await prisma.rite.findFirst({
    where: { name: { equals: riteName, mode: 'insensitive' } },
  })
  if (!rite) {
    return NextResponse.json({ error: `Rite not found: ${riteName}` }, { status: 400 })
  }

  let countryId: string | null = typeof body.countryId === 'string' && body.countryId ? body.countryId : null
  if (!countryId && countryName) {
    const existing = await prisma.country.findFirst({
      where: {
        OR: [
          { name: { equals: countryName, mode: 'insensitive' } },
          { isoCode: countryIsoCode },
        ],
      },
    })
    const country = existing ?? await prisma.country.create({
      data: {
        name: countryName,
        isoCode: countryIsoCode,
      },
    })
    countryId = country.id
  }

  const see = await prisma.see.create({
    data: {
      name,
      slug: await uniqueSeeSlug(name),
      seeType,
      riteId: rite.id,
      countryId,
      stateRegion: typeof body.stateRegion === 'string' && body.stateRegion.trim()
        ? body.stateRegion.trim()
        : null,
      isMetropolitan: false,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      seeType: true,
      stateRegion: true,
      country: { select: { name: true, isoCode: true } },
      rite: { select: { name: true } },
    },
  })

  return NextResponse.json(see, { status: 201 })
}
