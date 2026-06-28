/**
 * prisma/seed-sees.ts
 *
 * Truncates all See records (cascading to diocese_county, assignment, etc.)
 * and re-seeds from prisma/data/us-dioceses.csv.
 *
 * Run with: npm run seed:sees
 * Prerequisites: npm run seed (for rites and countries)
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

function mkSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseCsvRow(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

function parseCsv(content: string): Record<string, string>[] {
  const lines = content
    .replace(/\r/g, '')
    .split('\n')
    .filter((l) => l.trim() !== '')

  const headers = parseCsvRow(lines[0])
  return lines.slice(1).map((line) => {
    const values = parseCsvRow(line)
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Wipe all See records
  console.log('Truncating see table (cascades to diocese_county, assignment, see_name_history)...')
  await prisma.$executeRaw`TRUNCATE TABLE see CASCADE`

  // 2. Load prerequisite IDs
  const latinRite = await prisma.rite.findFirst({ where: { name: 'Latin' } })
  if (!latinRite) throw new Error('Latin rite not found — run: npm run seed')
  const us = await prisma.country.findFirst({ where: { isoCode: 'US' } })
  if (!us) throw new Error('United States not found — run: npm run seed')

  // 3. Parse CSV
  const csvPath = path.join(__dirname, 'data', 'us-dioceses.csv')
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf-8'))

  const metropolitanRows = rows.filter((r) => r.see_type === 'archdiocese')
  const suffraganRows    = rows.filter((r) => r.see_type !== 'archdiocese')

  // 4. Seed metropolitans — build province string → see.id map
  console.log(`Seeding ${metropolitanRows.length} metropolitan archdioceses...`)
  const provinceMap = new Map<string, string>()

  for (const row of metropolitanRows) {
    const see = await prisma.see.create({
      data: {
        name:              row.name,
        slug:              mkSlug(row.name),
        seeType:           row.see_type,
        riteId:            latinRite.id,
        countryId:         us.id,
        stateRegion:       row.state            || null,
        seeCity:           row.city             || null,
        isMetropolitan:    true,
        metropolitanSeeId: null,
        cathedralName:     row.cathedral_name    || null,
        coCathedralName:   row.co_cathedral_name || null,
      },
    })
    provinceMap.set(row.province, see.id)
  }

  // 5. Seed suffragans
  console.log(`Seeding ${suffraganRows.length} suffragan dioceses...`)
  const unmatched: string[] = []

  for (const row of suffraganRows) {
    const metropolitanSeeId = provinceMap.get(row.province) ?? null
    if (!metropolitanSeeId) {
      unmatched.push(`${row.name} (province: "${row.province}")`)
    }

    await prisma.see.create({
      data: {
        name:              row.name,
        slug:              mkSlug(row.name),
        seeType:           row.see_type,
        riteId:            latinRite.id,
        countryId:         us.id,
        stateRegion:       row.state            || null,
        seeCity:           row.city             || null,
        isMetropolitan:    false,
        metropolitanSeeId,
        cathedralName:     row.cathedral_name    || null,
        coCathedralName:   row.co_cathedral_name || null,
      },
    })
  }

  if (unmatched.length > 0) {
    console.warn('\nWarning — no metropolitan found for:')
    unmatched.forEach((m) => console.warn(`  - ${m}`))
  }

  // 6. Verification counts
  const [total, metros, suffragans] = await Promise.all([
    prisma.see.count(),
    prisma.see.count({ where: { isMetropolitan: true } }),
    prisma.see.count({ where: { isMetropolitan: false } }),
  ])

  console.log('\nDone.')
  console.log(`  Total sees:    ${total}`)
  console.log(`  Metropolitans: ${metros}`)
  console.log(`  Suffragans:    ${suffragans}`)
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
