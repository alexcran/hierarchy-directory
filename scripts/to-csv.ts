/**
 * Converts data/bishops-full.json into reviewable CSV files:
 *   data/bishops.csv     — one row per person
 *   data/assignments.csv — one row per CH assignment
 *
 * Open both in Excel or Google Sheets, fix names/errors, then run from-csv.ts to import.
 *
 * Usage: npx tsx scripts/to-csv.ts data/bishops-full.json
 */

import * as fs from 'fs'
import type { BishopFull } from './fetch-ch.ts'

// ── CSV helpers ───────────────────────────────────────────────────────────────

function cell(v: string | null | undefined | boolean): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function row(...fields: (string | null | undefined | boolean)[]): string {
  return fields.map(cell).join(',')
}

// ── Name extraction ───────────────────────────────────────────────────────────

const ORDER_MAP: Record<string, string> = {
  'Society of Jesus':             'S.J.',
  'Order of Friars Minor':        'O.F.M.',
  'Franciscans':                  'O.F.M.',
  'Capuchins':                    'O.F.M. Cap.',
  'Conventuals':                  'O.F.M. Conv.',
  'Dominicans':                   'O.P.',
  'Benedictines':                 'O.S.B.',
  'Augustinians':                 'O.S.A.',
  'Oblates of Mary Immaculate':   'O.M.I.',
  'Salesians':                    'S.D.B.',
  'Redemptorists':                'C.Ss.R.',
  'Congregation of Holy Cross':   'C.S.C.',
  'Vincentians':                  'C.M.',
  'Marians':                      'M.I.C.',
  'Carmelites':                   'O.Carm.',
  'Discalced Carmelites':         'O.C.D.',
  'Passionists':                  'C.P.',
  'Spiritans':                    'C.S.Sp.',
  'Norbertines':                  'O. Praem.',
  'Missionaries of Africa':       'M. Afr.',
  'Missionaries of the Holy Spirit': 'M.Sp.S.',
}

function abbreviateOrder(label: string | null): string {
  if (!label) return ''
  // Skip generic values — these are denomination fields, not religious institutes
  if (['Catholic Church', 'Roman Catholic Church', 'Christianity'].includes(label)) return ''
  for (const [name, abbr] of Object.entries(ORDER_MAP)) {
    if (label.toLowerCase().includes(name.toLowerCase())) return abbr
  }
  // Return the raw label if it's not "Catholic Church" — might be a named order we haven't mapped
  return label
}

function extractNames(bishop: BishopFull): { firstName: string; middleName: string; lastName: string } {
  // First name: Wikipedia URL is most reliable (it uses the common name, not baptismal)
  let firstName = ''
  if (bishop.wikipediaUrl) {
    const wikiPath = decodeURIComponent(bishop.wikipediaUrl.split('/wiki/')[1] ?? '')
    const first = wikiPath.split('_')[0]
    if (first && first.length > 1) firstName = first
  }

  // Last name: Wikidata P734 family-name entity (usually correct)
  let lastName = bishop.lastName ?? ''

  // Clean label: strip titles and suffixes
  const cleanLabel = bishop.label
    .replace(/\b(Cardinal|Archbishop|Bishop|Most Rev\.|His (Eminence|Excellency|Grace|Beatitude))\b/gi, '')
    .replace(/,.*$/, '')
    .trim()
  const parts = cleanLabel.split(/\s+/).filter(Boolean)

  if (!firstName && parts.length > 0) firstName = parts[0]
  if (!lastName && parts.length > 0) lastName = parts[parts.length - 1]

  // Middle name: words between first and last in the label
  let middleName = ''
  if (parts.length >= 3 && firstName && lastName) {
    // Find first occurrence of firstName and assume last word is lastName
    const fi = parts.findIndex(p => p.toLowerCase() === firstName.toLowerCase())
    if (fi >= 0 && parts.length - 1 > fi + 1) {
      middleName = parts.slice(fi + 1, parts.length - 1).join(' ')
    } else if (fi < 0) {
      // firstName not found in label — take middle words by position
      middleName = parts.slice(1, -1).join(' ')
    }
  }

  return { firstName, middleName, lastName }
}

// ── Eastern rite detection ────────────────────────────────────────────────────

const EASTERN_CHURCHES = [
  'greek catholic', 'ruthenian', 'ukrainian', 'byzantine', 'melkite',
  'maronite', 'chaldean', 'syriac', 'armenian', 'coptic',
  'syro-malabar', 'syro-malankara', 'romanian greek',
]

function detectRite(bishop: BishopFull): string {
  const order = (bishop.religiousOrder ?? '').toLowerCase()
  const sees = bishop.chAssignments.map(a => a.seeName.toLowerCase())
  if (EASTERN_CHURCHES.some(e => order.includes(e))) return 'eastern'
  if (sees.some(n => n.includes('eparchy') || n.includes('exarchate'))) return 'eastern'
  return 'latin'
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const inputFile = process.argv[2]
  if (!inputFile) {
    process.stderr.write('Usage: npx tsx scripts/to-csv.ts data/bishops-full.json\n')
    process.exit(1)
  }

  const bishops: BishopFull[] = JSON.parse(fs.readFileSync(inputFile, 'utf-8'))
  process.stderr.write(`Loaded ${bishops.length} bishops\n`)

  // ── bishops.csv ────────────────────────────────────────────────────────────
  const bishopLines: string[] = [
    row(
      'ch_id', 'wikidata_id', 'wikidata_label', 'wikipedia_url',
      'first_name', 'middle_name', 'last_name', 'suffix',
      'birth_date', 'death_date', 'birth_place',
      'religious_order', 'consecration_date', 'principal_consecrator',
      'rite', 'notes'
    ),
  ]

  // ── assignments.csv ────────────────────────────────────────────────────────
  const assignmentLines: string[] = [
    row(
      'ch_id', 'person_name',
      'diocese_ch_slug', 'diocese_name',
      'role', 'start_date', 'end_date', 'end_reason', 'is_current'
    ),
  ]

  let bishopCount = 0
  let assignmentCount = 0
  let skipped = 0

  for (const bishop of bishops) {
    // Skip bishops with no useful data (no CH ID and no Wikipedia URL)
    if (!bishop.chId && !bishop.wikipediaUrl) {
      skipped++
      continue
    }

    const { firstName, middleName, lastName } = extractNames(bishop)
    if (!firstName || !lastName) {
      skipped++
      continue
    }

    const birthDate  = bishop.chBirthDate  ?? bishop.birthDate  ?? ''
    const deathDate  = bishop.chDeathDate  ?? bishop.deathDate  ?? ''
    const birthPlace = bishop.chBirthPlace ?? bishop.birthPlaceLabel ?? ''
    const order      = abbreviateOrder(bishop.religiousOrder)
    const rite       = detectRite(bishop)
    const conDate    = bishop.chConsecration?.date ?? bishop.consecrationDate ?? ''
    const consecrator = bishop.chConsecration?.principalConsecrator ?? ''

    bishopLines.push(row(
      bishop.chId,
      bishop.wikidataId,
      bishop.label,
      bishop.wikipediaUrl,
      firstName,
      middleName,
      lastName,
      '',                 // suffix — user fills
      birthDate,
      deathDate,
      birthPlace,
      order,
      conDate,
      consecrator,
      rite,
      '',                 // notes — user fills
    ))
    bishopCount++

    // Assignments
    for (const asgn of bishop.chAssignments) {
      if (!asgn.seeChSlug) continue   // skip titlelar sees with no slug
      assignmentLines.push(row(
        bishop.chId,
        `${firstName} ${lastName}`,
        asgn.seeChSlug,
        asgn.seeName,
        asgn.role,
        asgn.startDate,
        asgn.endDate,
        asgn.endReason,
        asgn.isCurrent,
      ))
      assignmentCount++
    }
  }

  fs.writeFileSync('data/bishops.csv', bishopLines.join('\n') + '\n', 'utf-8')
  fs.writeFileSync('data/assignments.csv', assignmentLines.join('\n') + '\n', 'utf-8')

  process.stderr.write(`bishops.csv:     ${bishopCount} rows\n`)
  process.stderr.write(`assignments.csv: ${assignmentCount} rows\n`)
  process.stderr.write(`Skipped:         ${skipped} (no useful data)\n`)
}

main()
