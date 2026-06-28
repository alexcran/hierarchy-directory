/**
 * seed-counties.ts
 *
 * Populates the diocese_county table from prisma/data/diocese-counties.json.
 *
 * Usage:
 *   npm run seed:counties            # dry run check, then seed
 *   npm run seed:counties -- --force # wipe existing rows and reseed
 *
 * ─── HOW TO COMPLETE THE MAPPING ────────────────────────────────────────────
 *
 * The diocese-counties.json file needs one entry per US Latin-rite diocese
 * (~197 total). Each entry maps a diocese to every county it covers.
 *
 * Step 1 — List all sees
 *   After seeding the sees table, run:
 *     SELECT id, name FROM see WHERE rite_id = '<latin-rite-uuid>' ORDER BY name;
 *   This gives you the exact `name` values to use as `see_name` in the JSON.
 *   The `see_name` field must match `see.name` exactly (place name only,
 *   e.g. "Baltimore" not "Archdiocese of Baltimore").
 *
 * Step 2 — Compile county territories
 *   Primary sources (in order of authority):
 *     1. Official Catholic Directory (P.J. Kenedy & Sons) — published annually.
 *        Each diocese entry lists its constituent counties.
 *     2. USCCB diocese pages at usccb.org/about/leadership/bishops —
 *        many list territorial descriptions.
 *     3. GCatholic.org and catholic-hierarchy.org territory pages.
 *     4. Census Bureau county FIPS codes:
 *        census.gov/library/reference/code-lists/ansi.html
 *        Format: 5-digit string, zero-padded (state_fips + county_fips).
 *        E.g., Maryland (24) + Baltimore County (005) = "24005".
 *
 * Step 3 — Handle edge cases
 *   - Independent cities (Virginia, Baltimore City): treated as county-equivalents
 *     with their own FIPS codes (e.g., Baltimore City = "24510").
 *   - Alaska has boroughs/census areas instead of counties — use their FIPS codes.
 *   - Eastern eparchies are NOT included; their boundaries are non-territorial
 *     or overlap Latin-rite dioceses.
 *   - DC (FIPS "11001") belongs to the Archdiocese of Washington.
 *
 * Step 4 — Validate before running
 *   Remove the "__INSTRUCTIONS__" placeholder entry from the JSON, then run:
 *     npm run seed:counties
 *   Any see_name that can't be matched will be reported as an error with
 *   a suggested fuzzy match, so you can correct the JSON and re-run.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// PrismaClient types are only available after `prisma generate` has been run.
// We use `require` here so the script compiles before generate is executed.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')
type PrismaClientInstance = { [key: string]: any; $disconnect(): Promise<void> }

interface County {
  fips: string
  county_name: string
  state_name: string
  state_fips: string
}

interface DioceseEntry {
  see_name: string
  counties: County[]
  _note?: string
}

const FORCE = process.argv.includes('--force')

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set. Create a .env file or set it in your environment.')
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma: PrismaClientInstance = new PrismaClient({ adapter })

  try {
    await run(prisma)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

async function run(prisma: PrismaClientInstance) {
  const dataPath = path.join(__dirname, 'data', 'diocese-counties.json')

  if (!fs.existsSync(dataPath)) {
    throw new Error(`Data file not found: ${dataPath}`)
  }

  const raw = fs.readFileSync(dataPath, 'utf-8')
  const entries: DioceseEntry[] = JSON.parse(raw)

  // Strip instruction/placeholder entries
  const data = entries.filter(
    (e) => e.see_name !== '__INSTRUCTIONS__' && !e._note?.startsWith('see_name must match')
  )

  if (data.length === 0) {
    console.error('No diocese entries found in diocese-counties.json (only the placeholder entry exists).')
    console.error('Complete the JSON file following the instructions in prisma/seed-counties.ts, then re-run.')
    process.exit(1)
  }

  // Guard against accidental double-seeding
  const existingCount = await prisma.dioceseCounty.count()
  if (existingCount > 0) {
    if (!FORCE) {
      console.error(`diocese_county already has ${existingCount} rows.`)
      console.error('Run with --force to wipe and reseed: npm run seed:counties -- --force')
      process.exit(1)
    }
    console.log(`--force: deleting ${existingCount} existing rows...`)
    await prisma.dioceseCounty.deleteMany()
  }

  // Pre-load all sees for name lookup
  const allSees: Array<{ id: string; name: string }> = await prisma.see.findMany({ select: { id: true, name: true } })
  const seeByName = new Map(allSees.map((s) => [s.name.toLowerCase(), s]))

  let totalCreated = 0
  const notFound: string[] = []

  for (const diocese of data) {
    const see = seeByName.get(diocese.see_name.toLowerCase())

    if (!see) {
      // Suggest the closest name to help the user correct the JSON
      const suggestion = findClosestName(diocese.see_name, allSees.map((s: { id: string; name: string }) => s.name))
      notFound.push(
        `  "${diocese.see_name}"${suggestion ? ` (did you mean "${suggestion}"?)` : ''}`
      )
      continue
    }

    const rows = diocese.counties.map((c) => ({
      seeId: see.id,
      countyFips: c.fips,
      stateFips: c.state_fips,
      countyName: c.county_name,
      stateName: c.state_name,
    }))

    const result = await prisma.dioceseCounty.createMany({ data: rows })
    totalCreated += result.count
    console.log(`  ${diocese.see_name}: ${result.count} counties`)
  }

  console.log(`\nDone. Created ${totalCreated} diocese_county rows across ${data.length - notFound.length} diocese(s).`)

  if (notFound.length > 0) {
    console.error(`\n${notFound.length} diocese(s) not matched in the sees table — correct see_name in the JSON and re-run:`)
    notFound.forEach((msg) => console.error(msg))
    process.exit(1)
  }
}

/** Returns the name from `candidates` with the most character overlap with `target`. */
function findClosestName(target: string, candidates: string[]): string | null {
  if (candidates.length === 0) return null
  const t = target.toLowerCase()
  let best = candidates[0]
  let bestScore = 0
  for (const c of candidates) {
    const score = c.toLowerCase().split('').filter((ch: string) => t.includes(ch)).length
    if (score > bestScore) {
      bestScore = score
      best = c
    }
  }
  return bestScore > 2 ? best : null
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
