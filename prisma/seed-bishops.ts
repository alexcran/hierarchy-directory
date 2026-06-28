/**
 * prisma/seed-bishops.ts
 *
 * Seeds Person, Assignment, PriesthoodOrdination, and EpiscopalConsecration
 * records from prisma/data/current_us_bishops_20.csv.
 *
 * Run with: npm run seed:bishops
 * Prerequisites: npm run seed && npm run seed:sees
 *
 * Consecrators that are not in the bishop list are created as minimal Person
 * stubs (name + rite only) so the FK links work. Consecrators that appear
 * multiple times are only created once (cached by firstName|lastName).
 *
 * Not idempotent — re-running will create duplicates. Guard with the person
 * count check at the top.
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

function mkPersonSlug(firstName: string, middleName: string | null, lastName: string): string {
  const parts = [firstName]
  if (middleName?.trim()) parts.push(middleName.trim().charAt(0))
  parts.push(lastName)
  return parts.join(' ').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseCsvRow(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++ }
      else if (ch === '"') { inQuotes = false }
      else { current += ch }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      fields.push(current); current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '')
  const headers = parseCsvRow(lines[0])
  return lines.slice(1).map((line) => {
    const values = parseCsvRow(line)
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * "Archdiocese of Boston" → "Boston"
 * "Diocese of Arlington" → "Arlington"
 */
function stripSeePrefix(fullName: string): string {
  return fullName.replace(/^(Arch)?diocese\s+of\s+/i, '').trim()
}

/**
 * "Tarcisio Pietro Evasio Bertone" → { firstName: "Tarcisio", middleName: "Pietro Evasio", lastName: "Bertone" }
 * "Seán Patrick O'Malley"          → { firstName: "Seán",     middleName: "Patrick",        lastName: "O'Malley" }
 * "John Barres"                    → { firstName: "John",     middleName: null,              lastName: "Barres" }
 */
function parseFullName(full: string): { firstName: string; middleName: string | null; lastName: string } {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], middleName: null, lastName: parts[0] }
  if (parts.length === 2) return { firstName: parts[0], middleName: null, lastName: parts[1] }
  return {
    firstName:  parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName:   parts[parts.length - 1],
  }
}

function toDate(s: string): Date | null {
  return s ? new Date(s) : null
}

// ─── Find-or-create a Person by name ─────────────────────────────────────────

async function findOrCreatePerson(
  firstName: string,
  middleName: string | null,
  lastName: string,
  latinRiteId: string,
  cache: Map<string, string>,
): Promise<{ id: string; isNew: boolean }> {
  const key = `${firstName}|${lastName}`
  if (cache.has(key)) return { id: cache.get(key)!, isNew: false }

  const existing = await prisma.person.findFirst({ where: { firstName, lastName } })
  if (existing) {
    cache.set(key, existing.id)
    return { id: existing.id, isNew: false }
  }

  const created = await prisma.person.create({
    data: { firstName, middleName, lastName, slug: mkPersonSlug(firstName, middleName, lastName), riteId: latinRiteId },
  })
  cache.set(key, created.id)
  return { id: created.id, isNew: true }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const existingPersons = await prisma.person.count()
  if (existingPersons > 0) {
    console.log(`Persons table already has ${existingPersons} records. Aborting to avoid duplicates.`)
    console.log('To re-seed, manually run: DELETE FROM person CASCADE')
    return
  }

  const latinRite = await prisma.rite.findFirst({ where: { name: 'Latin' } })
  if (!latinRite) throw new Error('Latin rite not found — run: npm run seed')

  const csvPath = path.join(__dirname, 'data', 'current_us_bishops_20.csv')
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf-8'))

  // Cache: "firstName|lastName" → personId
  // Populated in pass 1 (bishops) so pass 2 can find them when they appear as consecrators.
  const personCache = new Map<string, string>()

  let bishopsCreated    = 0
  let consecStubsCreated = 0
  let assignmentsCreated = 0
  let ordinationsCreated = 0
  let consecrationsCreated = 0
  const warnings: string[] = []

  // ── Pass 1: create all 20 bishop Person records ───────────────────────────
  // Do this before pass 2 so that when a bishop is also a consecrator
  // (e.g. Nelson Perez consecrating Philadelphia auxiliaries) the cache hit works.

  const bishopIds: string[] = []

  for (const row of rows) {
    const dob = toDate(row.date_of_birth)
    const person = await prisma.person.create({
      data: {
        firstName:   row.first_name,
        middleName:  row.middle_name || null,
        lastName:    row.last_name,
        slug:        mkPersonSlug(row.first_name, row.middle_name || null, row.last_name),
        dateOfBirth: dob,
        riteId:      latinRite.id,
      },
    })
    personCache.set(`${row.first_name}|${row.last_name}`, person.id)
    bishopIds.push(person.id)
    bishopsCreated++
  }

  // ── Pass 2: ordinations, consecrations, assignments ───────────────────────

  for (let i = 0; i < rows.length; i++) {
    const row      = rows[i]
    const personId = bishopIds[i]

    // Priesthood ordination
    if (row.ordained_priest) {
      await prisma.priesthoodOrdination.create({
        data: {
          personId,
          date: new Date(row.ordained_priest),
        },
      })
      ordinationsCreated++
    }

    // Episcopal consecration
    if (row.ordained_bishop) {
      let principalConsecratorId: string | null = null

      if (row.principal_consecrator) {
        const { firstName, middleName, lastName } = parseFullName(row.principal_consecrator)
        const result = await findOrCreatePerson(firstName, middleName, lastName, latinRite.id, personCache)
        principalConsecratorId = result.id
        if (result.isNew) consecStubsCreated++
      }

      await prisma.episcopalConsecration.create({
        data: {
          personId,
          date: new Date(row.ordained_bishop),
          principalConsecratorId,
        },
      })
      consecrationsCreated++
    }

    // Assignment → See
    const seeName = stripSeePrefix(row.current_see)
    const see = await prisma.see.findFirst({ where: { name: seeName } })
    if (!see) {
      warnings.push(`Row ${i + 2}: See not found for "${row.current_see}" (looked for "${seeName}")`)
      continue
    }

    const role      = row.role === 'Ordinary' ? 'ordinary' : 'auxiliary'
    const startDate = row.ordained_bishop ? new Date(row.ordained_bishop) : new Date(row.date_of_birth)

    await prisma.assignment.create({
      data: {
        personId,
        seeId:       see.id,
        role,
        startDate,
        startReason: 'appointment',
        isCurrent:   true,
      },
    })
    assignmentsCreated++
  }

  if (warnings.length) {
    console.warn('\nWarnings:')
    warnings.forEach((w) => console.warn(`  ${w}`))
  }

  console.log('\nDone.')
  console.log(`  Persons created (bishops):      ${bishopsCreated}`)
  console.log(`  Persons created (consecrators): ${consecStubsCreated}`)
  console.log(`  Priesthood ordinations:         ${ordinationsCreated}`)
  console.log(`  Episcopal consecrations:        ${consecrationsCreated}`)
  console.log(`  Assignments:                    ${assignmentsCreated}`)
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
