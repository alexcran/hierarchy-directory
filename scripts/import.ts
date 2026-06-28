/**
 * Imports enriched bishop data into the database.
 * Matches sees by name (fuzzy), upserts persons by CH ID or slug,
 * creates assignments and consecrations.
 *
 * Usage:
 *   npx tsx scripts/import.ts --dry-run data/bishops-full.json   # preview
 *   npx tsx scripts/import.ts data/bishops-full.json             # commit
 *
 * Options:
 *   --dry-run     Print what would be created/updated, make no DB changes
 *   --limit N     Process only the first N records (useful for testing)
 *   --skip-ch     Skip CH-derived assignments and consecrations (names only)
 */

import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })
import * as fs from 'fs'
import { Pool } from 'pg'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import type { BishopFull } from './fetch-ch.ts'

const pool   = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const args         = process.argv.slice(2)
const DRY_RUN      = args.includes('--dry-run')
const SKIP_CH      = args.includes('--skip-ch')
const limitArg     = args.find(a => a.startsWith('--limit='))
const LIMIT        = limitArg ? parseInt(limitArg.split('=')[1]) : null
const inputFile    = args.find(a => !a.startsWith('--'))

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) { process.stdout.write(msg + '\n') }
function dim(msg: string) { process.stdout.write(`  \x1b[2m${msg}\x1b[0m\n`) }
function ok(msg: string)  { process.stdout.write(`  \x1b[32m✓\x1b[0m ${msg}\n`) }
function warn(msg: string){ process.stdout.write(`  \x1b[33m⚠\x1b[0m ${msg}\n`) }
function skip(msg: string){ process.stdout.write(`  \x1b[2m· ${msg}\x1b[0m\n`) }

function makeSlug(firstName: string, lastName: string): string {
  const diacritics: Record<string, string> = {
    á:'a',à:'a',ä:'a',â:'a',ã:'a',å:'a',
    é:'e',è:'e',ë:'e',ê:'e',
    í:'i',ì:'i',ï:'i',î:'i',
    ó:'o',ò:'o',ö:'o',ô:'o',õ:'o',ø:'o',
    ú:'u',ù:'u',ü:'u',û:'u',
    ñ:'n',ç:'c',ý:'y',
    Á:'a',À:'a',Ä:'a',Â:'a',É:'e',È:'e',Ë:'e',
    Í:'i',Ó:'o',Ú:'u',Ñ:'n',Ç:'c',
    "'": '', '’': '', '‘': '',
  }
  const normalize = (s: string) =>
    s.split('').map(c => diacritics[c] ?? c).join('')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  return `${normalize(firstName)}-${normalize(lastName)}`
}

// Parse the label "Seán Patrick Cardinal O'Malley" → {firstName, lastName}
// This is a best-effort fallback when Wikidata structured names are missing.
function parseLabel(label: string): { firstName: string; middleName: string | null; lastName: string } {
  const parts = label
    .replace(/\b(Cardinal|Archbishop|Bishop|Most Rev\.|His (Eminence|Excellency|Grace|Beatitude))\b/gi, '')
    .replace(/,.*$/, '')   // drop suffix after comma
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return { firstName: 'Unknown', middleName: null, lastName: 'Unknown' }
  if (parts.length === 1) return { firstName: parts[0], middleName: null, lastName: parts[0] }
  if (parts.length === 2) return { firstName: parts[0], middleName: null, lastName: parts[1] }
  // 3+ parts: first, middle(s), last
  return {
    firstName:  parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName:   parts[parts.length - 1],
  }
}

// ── See cache ─────────────────────────────────────────────────────────────────

type SeeRecord = { id: string; name: string; seeType: string }
let seeCache: SeeRecord[] | null = null

async function loadSees(): Promise<SeeRecord[]> {
  if (seeCache) return seeCache
  seeCache = await prisma.see.findMany({
    where: { dateSuppressed: null },
    select: { id: true, name: true, seeType: true },
  })
  return seeCache
}

function matchSee(rawName: string, sees: SeeRecord[]): SeeRecord | null {
  const normalize = (s: string) => s.toLowerCase()
    .replace(/archdiocese of|diocese of|eparchy of|apostolic exarchate of/gi, '')
    .replace(/[^a-z\s]/g, '').trim()

  const target = normalize(rawName)
  // Exact normalized match first
  const exact = sees.find(s => normalize(s.name) === target)
  if (exact) return exact
  // Substring match
  const sub = sees.find(s => target.includes(normalize(s.name)) || normalize(s.name).includes(target))
  return sub ?? null
}

// ── Rite ─────────────────────────────────────────────────────────────────────

type RiteRecord = { id: string; name: string; type: string }
let riteCache: RiteRecord[] | null = null

async function loadRites(): Promise<RiteRecord[]> {
  if (riteCache) return riteCache
  riteCache = await prisma.rite.findMany({ select: { id: true, name: true, type: true } })
  return riteCache
}

async function resolveRite(bishop: BishopFull): Promise<{ id: string; isEastern: boolean }> {
  const rites = await loadRites()
  const latin = rites.find(r => r.type === 'latin')
  if (!latin) throw new Error('Latin rite not found in DB')

  // Detect Eastern rite from Wikidata religiousOrder or CH see names
  const EASTERN_CHURCHES = [
    'greek catholic', 'ruthenian', 'ukrainian', 'byzantine', 'melkite',
    'maronite', 'chaldean', 'syriac', 'armenian', 'coptic',
    'syro-malabar', 'syro-malankara', 'romanian greek',
  ]
  const orderLabel = (bishop.religiousOrder ?? '').toLowerCase()
  const seeNames   = bishop.chAssignments.map(a => a.seeName.toLowerCase())

  const isEasternByOrder = EASTERN_CHURCHES.some(e => orderLabel.includes(e))
  const isEasternBySee   = seeNames.some(n => n.includes('eparchy') || n.includes('exarchate'))

  if (!isEasternByOrder && !isEasternBySee) return { id: latin.id, isEastern: false }

  // Try to match a specific Eastern rite by name
  const allEastern = rites.filter(r => r.type === 'eastern')
  const matched = allEastern.find(r =>
    EASTERN_CHURCHES.some(e => r.name.toLowerCase().includes(e) && orderLabel.includes(e))
  )
  const easternId = matched?.id ?? allEastern[0]?.id ?? latin.id
  return { id: easternId, isEastern: true }
}

// ── Religious order abbreviation ──────────────────────────────────────────────

const ORDER_MAP: Record<string, string> = {
  'Society of Jesus':              'S.J.',
  'Franciscans':                   'O.F.M.',
  'Order of Friars Minor':         'O.F.M.',
  'Capuchins':                     'O.F.M. Cap.',
  'Conventuals':                   'O.F.M. Conv.',
  'Dominicans':                    'O.P.',
  'Benedictines':                  'O.S.B.',
  'Augustinians':                  'O.S.A.',
  'Oblates of Mary Immaculate':    'O.M.I.',
  'Salesians':                     'S.D.B.',
  'Redemptorists':                 'C.Ss.R.',
  'Missionaries of the Holy Spirit':'M.Sp.S.',
  'Congregation of Holy Cross':    'C.S.C.',
  'Vincentians':                   'C.M.',
  'Marians':                       'M.I.C.',
  'Carmelites':                    'O.Carm.',
  'Discalced Carmelites':          'O.C.D.',
  'Passionists':                   'C.P.',
  'Spiritans':                     'C.S.Sp.',
  'Norbertines':                   'O. Praem.',
  'Missionaries of Africa':        'M. Afr.',
}

function abbreviateOrder(label: string | null): string | null {
  if (!label) return null
  for (const [name, abbr] of Object.entries(ORDER_MAP)) {
    if (label.toLowerCase().includes(name.toLowerCase())) return abbr
  }
  return null   // unknown order — leave blank rather than guess
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Stats {
  created:  number
  updated:  number
  skipped:  number
  errors:   number
  noSee:    number
}

async function processBishop(bishop: BishopFull, sees: SeeRecord[], stats: Stats) {
  const { id: riteId, isEastern } = await resolveRite(bishop)
  if (isEastern) warn(`Eastern rite detected — ${bishop.religiousOrder ?? ''} / see: ${bishop.chAssignments.map(a => a.seeName).join(', ')}`)

  // Determine name
  let firstName  = bishop.firstName
  let lastName   = bishop.lastName
  let middleName: string | null = null
  if (!firstName || !lastName) {
    const parsed = parseLabel(bishop.label)
    firstName  = firstName ?? parsed.firstName
    lastName   = lastName  ?? parsed.lastName
    middleName = parsed.middleName
  }
  if (!firstName || !lastName) {
    warn(`Skipping — could not determine name: "${bishop.label}"`)
    stats.skipped++
    return
  }

  const displayName = `${firstName} ${lastName}`

  // ── Find or create Person ──────────────────────────────────────────────────
  let person = bishop.chId
    ? await prisma.person.findFirst({ where: { catholicHierarchyId: bishop.chId } })
    : null

  // Fall back to Wikidata ID match via Wikipedia URL (stored in wikipediaUrl field)
  if (!person && bishop.wikipediaUrl) {
    person = await prisma.person.findFirst({ where: { wikipediaUrl: bishop.wikipediaUrl } })
  }

  if (person) {
    // Update existing record with any new data
    const updateData = {
      ...(bishop.chId && !person.catholicHierarchyId ? { catholicHierarchyId: bishop.chId } : {}),
      ...(bishop.wikipediaUrl && !person.wikipediaUrl ? { wikipediaUrl: bishop.wikipediaUrl } : {}),
      ...(bishop.birthDate && !person.dateOfBirth ? { dateOfBirth: new Date(bishop.birthDate) } : {}),
      ...(bishop.deathDate && !person.dateOfDeath ? { dateOfDeath: new Date(bishop.deathDate) } : {}),
      ...(bishop.chBirthDate && !person.dateOfBirth ? { dateOfBirth: new Date(bishop.chBirthDate) } : {}),
      ...(bishop.chDeathDate && !person.dateOfDeath ? { dateOfDeath: new Date(bishop.chDeathDate) } : {}),
      ...(bishop.chBirthPlace && !person.placeOfBirth ? { placeOfBirth: bishop.chBirthPlace } : {}),
    }
    const hasUpdates = Object.keys(updateData).length > 0
    if (hasUpdates) {
      ok(`UPDATE ${displayName} — ${Object.keys(updateData).join(', ')}`)
      if (!DRY_RUN) await prisma.person.update({ where: { id: person.id }, data: updateData })
      stats.updated++
    } else {
      skip(`EXISTS ${displayName}`)
      stats.skipped++
    }
  } else {
    // Generate unique slug
    let slug = makeSlug(firstName, lastName)
    if (!DRY_RUN) {
      let n = 1
      while (await prisma.person.findUnique({ where: { slug } })) {
        slug = `${makeSlug(firstName, lastName)}-${n++}`
      }
    }

    const religiousOrder = abbreviateOrder(bishop.religiousOrder)
    const birthDate  = bishop.chBirthDate  ?? bishop.birthDate
    const deathDate  = bishop.chDeathDate  ?? bishop.deathDate
    const birthPlace = bishop.chBirthPlace ?? bishop.birthPlaceLabel

    ok(`CREATE ${displayName}${religiousOrder ? ` ${religiousOrder}` : ''}`)

    if (!DRY_RUN) {
      person = await prisma.person.create({
        data: {
          firstName,
          middleName,
          lastName,
          slug,
          riteId,
          catholicHierarchyId: bishop.chId,
          wikipediaUrl:        bishop.wikipediaUrl,
          dateOfBirth:         birthDate  ? new Date(birthDate)  : null,
          dateOfDeath:         deathDate  ? new Date(deathDate)  : null,
          placeOfBirth:        birthPlace ?? null,
        },
      })
    }
    stats.created++
  }

  if (!person || SKIP_CH) return

  // ── Assignments ────────────────────────────────────────────────────────────
  for (const asgn of bishop.chAssignments) {
    const see = matchSee(asgn.seeName, sees)
    if (!see) {
      warn(`No see match for "${asgn.seeName}" (${displayName})`)
      stats.noSee++
      continue
    }

    // Skip if assignment already exists
    const existing = await prisma.assignment.findFirst({
      where: {
        personId:  person.id,
        seeId:     see.id,
        startDate: asgn.startDate ? new Date(asgn.startDate) : undefined,
        role:      asgn.role,
      },
    })
    if (existing) {
      dim(`  assignment exists: ${asgn.role} @ ${see.name}`)
      continue
    }

    dim(`  + assignment: ${asgn.role} @ ${see.name} (${asgn.startDate ?? '?'} – ${asgn.endDate ?? 'present'})`)

    if (!DRY_RUN && asgn.startDate) {
      await prisma.assignment.create({
        data: {
          personId:    person.id,
          seeId:       see.id,
          role:        asgn.role,
          startDate:   new Date(asgn.startDate),
          endDate:     asgn.endDate ? new Date(asgn.endDate) : null,
          isCurrent:   asgn.isCurrent,
          startReason: 'appointed',
          endReason:   asgn.isCurrent ? null : (asgn.endReason ?? 'other'),
        },
      })
    }
  }

  // ── Consecration ──────────────────────────────────────────────────────────
  if (bishop.chConsecration) {
    const existingCon = await prisma.episcopalConsecration.findFirst({
      where: { personId: person.id },
    })
    if (!existingCon) {
      const con = bishop.chConsecration
      dim(`  + consecration: ${con.date ?? '?'} by ${con.principalConsecrator ?? 'unknown'}`)
      if (!DRY_RUN && con.date) {
        await prisma.episcopalConsecration.create({
          data: {
            personId: person.id,
            date:     new Date(con.date),
            // principalConsecrator matched by name is too error-prone at import time —
            // link those manually in the admin after import.
          },
        })
      }
    } else {
      dim(`  consecration exists`)
    }
  }
}

async function main() {
  if (!inputFile) {
    process.stderr.write('Usage: npx tsx scripts/import.ts [--dry-run] [--limit=N] <input.json>\n')
    process.exit(1)
  }

  const bishops: BishopFull[] = JSON.parse(fs.readFileSync(inputFile, 'utf-8'))
  const batch = LIMIT ? bishops.slice(0, LIMIT) : bishops

  log(`\n${ DRY_RUN ? '🔍 DRY RUN — no changes will be written' : '⚡ LIVE RUN — writing to database' }`)
  log(`Processing ${batch.length} bishops${LIMIT ? ` (limited from ${bishops.length})` : ''}\n`)

  const sees  = await loadSees()
  const stats: Stats = { created: 0, updated: 0, skipped: 0, errors: 0, noSee: 0 }

  for (let i = 0; i < batch.length; i++) {
    const bishop = batch[i]
    log(`[${i + 1}/${batch.length}] ${bishop.label}`)
    try {
      await processBishop(bishop, sees, stats)
    } catch (err) {
      warn(`ERROR: ${err instanceof Error ? err.message : String(err)}`)
      stats.errors++
    }
  }

  log('\n── Summary ──────────────────────────────────────')
  log(`  Created:      ${stats.created}`)
  log(`  Updated:      ${stats.updated}`)
  log(`  Skipped:      ${stats.skipped}`)
  log(`  See not found:${stats.noSee}`)
  log(`  Errors:       ${stats.errors}`)
  log(DRY_RUN ? '\n  (No changes written — remove --dry-run to commit)' : '\n  Done.')

  await prisma.$disconnect()
}

main().catch(err => { console.error(err); process.exit(1) })
