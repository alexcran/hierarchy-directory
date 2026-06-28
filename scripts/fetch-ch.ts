/**
 * Scrapes Catholic-Hierarchy.org for each bishop that has a CH ID.
 * Reads data/bishops-wikidata.json (or argv path), enriches with assignments
 * and consecration details, writes enriched JSON to stdout.
 *
 * Usage: npx tsx scripts/fetch-ch.ts data/bishops-wikidata.json > data/bishops-full.json
 *
 * Polite scraper: 1-second delay between requests.
 */

import * as fs from 'fs'
import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'
import type { BishopWikidata } from './fetch-wikidata.ts'

const BASE_URL = 'https://www.catholic-hierarchy.org/bishop'
const DELAY_MS = 1000

export interface ChAssignment {
  role:      string
  seeName:   string        // raw diocese name from CH link text
  seeChSlug: string | null // CH diocese slug e.g. "dspmo" from /diocese/dspmo.html
  startDate: string | null // ISO date
  endDate:   string | null
  endReason: string | null // 'retired' | 'resigned' | 'died' | 'transferred' | null
  isCurrent: boolean
}

export interface ChConsecration {
  date:                 string | null
  location:             string | null
  principalConsecrator: string | null  // name as scraped
  principalCHId:        string | null  // CH bishop ID from href e.g. "may" from bmay.html
  coConsecrators: Array<{ name: string; chId: string | null }>
}

export interface BishopFull extends BishopWikidata {
  chAssignments:  ChAssignment[]
  chConsecration: ChConsecration | null
  chBirthDate:    string | null
  chDeathDate:    string | null
  chBirthPlace:   string | null
  chFetchError:   string | null
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Parse "8 Aug 1930" or "Aug 1930" or "1930" → ISO date
function parseChDate(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = raw.trim()
  const months: Record<string, string> = {
    jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06',
    jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12',
  }
  const full = s.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/)
  if (full) {
    const mo = months[full[2].toLowerCase()]
    if (mo) return `${full[3]}-${mo}-${full[1].padStart(2, '0')}`
  }
  const my = s.match(/([A-Za-z]{3})\s+(\d{4})/)
  if (my) {
    const mo = months[my[1].toLowerCase()]
    if (mo) return `${my[2]}-${mo}-01`
  }
  const y = s.match(/^(\d{4})$/)
  if (y) return `${y[1]}-01-01`
  return null
}

// Extract the CH bishop ID from an href like "bmay.html" → "may"
function bishopHrefToId(href: string | undefined): string | null {
  if (!href) return null
  const m = href.match(/b([^.\/]+)\.html/)
  return m ? m[1] : null
}

// Extract diocese slug from href like "/diocese/dspmo.html" → "dspmo"
function dioceseHrefToSlug(href: string | undefined): string | null {
  if (!href) return null
  const m = href.match(/\/diocese\/([^.\/]+)\.html/)
  return m ? m[1] : null
}

// Map CH event types to our role enum
function eventToRole(eventText: string, titleText: string): string {
  const e = eventText.toLowerCase()
  const t = titleText.toLowerCase()
  if (t.includes('coadjutor'))                  return 'coadjutor'
  if (t.includes('auxiliary'))                  return 'auxiliary'
  if (t.includes('apostolic administrator'))    return 'apostolic_administrator'
  if (t.includes('apostolic exarch'))           return 'apostolic_administrator'
  if (t.includes('archbishop emeritus'))        return 'archbishop_emeritus'
  if (t.includes('bishop emeritus'))            return 'bishop_emeritus'
  if (t.includes('patriarch'))                  return 'patriarch'
  if (t.includes('major archbishop'))           return 'major_archbishop'
  if (t.includes('metropolitan'))               return 'metropolitan'
  if (t.includes('archbishop'))                 return 'archbishop'
  if (e.includes('appointed') || t.includes('bishop') || t.includes('cardinal'))  return 'ordinary'
  return 'ordinary'
}

function endReasonFromEvent(eventText: string): string | null {
  const e = eventText.toLowerCase()
  if (e.includes('retir'))  return 'retired'
  if (e.includes('resign')) return 'resigned'
  if (e.includes('died') || e.includes('death')) return 'died'
  if (e.includes('transfer') || e.includes('appoint')) return 'transferred'
  return 'other'
}

async function fetchBishopPage(chId: string): Promise<{
  assignments:  ChAssignment[]
  consecration: ChConsecration | null
  birthDate:    string | null
  deathDate:    string | null
  birthPlace:   string | null
}> {
  const url = `${BASE_URL}/b${chId}.html`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'HierarchyDirectory/1.0 (https://hierarchy.directory; ac@alexcran.com)',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  const $ = cheerio.load(html)

  // ── Main event table: Date | Age | Event | Title ──────────────────────────
  // Find the table with those exact headers
  let eventTable: cheerio.Cheerio<AnyNode> | null = null
  $('table').each((_, tbl) => {
    const headers = $(tbl).find('th').map((_, th) => $(th).text().trim().toLowerCase()).get()
    if (headers.includes('date') && headers.includes('event')) {
      eventTable = $(tbl) as unknown as cheerio.Cheerio<AnyNode>
    }
  })

  // ── Parse events ───────────────────────────────────────────────────────────
  let birthDate: string | null = null
  let deathDate: string | null = null

  // Each event row: [dateCell, ageCell, eventCell, titleCell]
  interface EventRow {
    date:     string
    event:    string
    title:    string
    dioCells: Array<{ name: string; slug: string | null }>
  }
  const events: EventRow[] = []

  if (eventTable) {
    (eventTable as unknown as cheerio.Cheerio<AnyNode>).find('tr').slice(1).each((_, row) => {
      const cells = $(row).find('td')
      if (cells.length < 3) return

      // Date cell: text from both <a> tags combined
      const dateCell  = $(cells[0])
      const dateParts = dateCell.find('a').map((_, a) => $(a).text().trim()).get()
      const dateStr   = dateParts.join(' ').trim()

      const eventText = $(cells[2]).text().trim()
      const titleCell = $(cells[3] ?? cells[2])
      const titleText = titleCell.text().trim()

      // Collect diocese links from the title cell
      const dioCells: Array<{ name: string; slug: string | null }> = []
      titleCell.find('a[href*="/diocese/"]').each((_, a) => {
        dioCells.push({
          name: $(a).text().trim(),
          slug: dioceseHrefToSlug($(a).attr('href')),
        })
      })

      events.push({ date: dateStr, event: eventText, title: titleText, dioCells })
    })
  }

  // Extract birth / death from events
  for (const ev of events) {
    if (ev.event === 'Born')  birthDate = parseChDate(ev.date)
    if (ev.event === 'Died')  deathDate = parseChDate(ev.date)
  }

  // ── Build assignments from event pairs ─────────────────────────────────────
  // CH records "Appointed" then later "Retired/Resigned/Died/Appointed" (which ends the prior role)
  // We track open positions and close them when we see a terminating event.

  interface OpenAssignment {
    role:      string
    seeName:   string
    seeChSlug: string | null
    startDate: string | null
  }

  const assignments: ChAssignment[] = []
  // Stack of open appointments (a bishop can have one at a time, but we'll be safe)
  const open: OpenAssignment[] = []

  const APPOINTMENT_EVENTS = new Set(['appointed', 'succeeded', 'installed', 'coadjutor', 'named', 'elected'])
  const TERMINATION_EVENTS = new Set(['retired', 'resigned', 'died', 'transferred'])

  for (const ev of events) {
    const eLow = ev.event.toLowerCase()

    const isAppointment = APPOINTMENT_EVENTS.has(eLow) ||
      eLow.includes('appoint') || eLow.includes('named') || eLow.includes('elect')
    const isTermination = TERMINATION_EVENTS.has(eLow) ||
      eLow.includes('retir') || eLow.includes('resign') || eLow.includes('died') || eLow.includes('transfer')

    if (isAppointment && ev.dioCells.length > 0) {
      // Close any open assignment if we're being appointed to a different see
      if (open.length > 0 && ev.dioCells[0].slug !== open[open.length - 1].seeChSlug) {
        const prev = open.pop()!
        assignments.push({
          ...prev,
          endDate:   parseChDate(ev.date),
          endReason: 'transferred',
          isCurrent: false,
        })
      }
      open.push({
        role:      eventToRole(ev.event, ev.title),
        seeName:   ev.dioCells[0].name,
        seeChSlug: ev.dioCells[0].slug,
        startDate: parseChDate(ev.date),
      })
    }

    if (isTermination && open.length > 0) {
      const prev = open.pop()!
      assignments.push({
        ...prev,
        endDate:   parseChDate(ev.date),
        endReason: endReasonFromEvent(ev.event),
        isCurrent: false,
      })
    }
  }

  // Any still-open assignments are current
  for (const o of open) {
    assignments.push({ ...o, endDate: null, endReason: null, isCurrent: true })
  }

  // ── Consecration ───────────────────────────────────────────────────────────
  // Date comes from "Ordained Bishop" event row
  const ordBishopEvent = events.find(e => e.event === 'Ordained Bishop')
  const consecrationDate = ordBishopEvent ? parseChDate(ordBishopEvent.date) : null

  // Consecrators are in bullet lists after the main table
  let principalConsecrator: string | null = null
  let principalCHId: string | null = null
  const coConsecrators: Array<{ name: string; chId: string | null }> = []
  let consecrationLocation: string | null = null

  // Find the two-column info table (has "Principal Consecrator:" text)
  const fullText = $.html()
  const priConsMatch = fullText.match(/Principal Consecrator:.*?<ul>(.*?)<\/ul>/s)
  if (priConsMatch) {
    const priCheerio = cheerio.load(priConsMatch[1])
    priCheerio('a').each((i, a) => {
      if (i === 0) {
        principalConsecrator = priCheerio(a).text().replace(/[†✝]/g, '').trim()
        principalCHId = bishopHrefToId(priCheerio(a).attr('href'))
      }
    })
  }

  const coConsMatch = fullText.match(/Principal Co-Consecrators?:.*?<ul>(.*?)<\/ul>/s)
  if (coConsMatch) {
    const coCheerio = cheerio.load(coConsMatch[1])
    coCheerio('a[href*=".html"]').each((_, a) => {
      const href = coCheerio(a).attr('href') ?? ''
      if (!href.includes('/diocese/') && !href.includes('/country/')) {
        coConsecrators.push({
          name:  coCheerio(a).text().replace(/[†✝]/g, '').trim(),
          chId:  bishopHrefToId(href),
        })
      }
    })
  }

  // Consecration location from "Event | Place" table
  $('table').each((_, tbl) => {
    const headers = $(tbl).find('th').map((_, th) => $(th).text().trim().toLowerCase()).get()
    if (headers.includes('event') && headers.includes('place')) {
      $(tbl).find('tr').each((_, row) => {
        const cells = $(row).find('td')
        const label = $(cells[0]).text().trim().toLowerCase()
        if (label.includes('ordained bishop')) {
          consecrationLocation = $(cells[1]).text().trim() || null
        }
      })
    }
  })

  // Birth place from same Event|Place table
  $('table').each((_, tbl) => {
    const headers = $(tbl).find('th').map((_, th) => $(th).text().trim().toLowerCase()).get()
    if (headers.includes('event') && headers.includes('place')) {
      $(tbl).find('tr').each((_, row) => {
        const cells = $(row).find('td')
        const label = $(cells[0]).text().trim().toLowerCase()
        if (label.includes('birth')) {
          const placeText = $(cells[1]).text().trim()
          if (placeText) {
            // Try to get state/country context from the birth event row
            const birthEvent = events.find(e => e.event === 'Born')
            const place = birthEvent?.title ?? placeText
            const birthPlaceRaw = place || placeText
            // Store just the city/place for now
            if (birthPlaceRaw) {
              // Will be stored in chBirthPlace
            }
          }
        }
      })
    }
  })

  // Also get birth place from MicroData if available
  const microBirthPlace = $('[itemprop="birthPlace"]').text().trim() || null

  const consecration: ChConsecration | null = (consecrationDate || principalConsecrator)
    ? { date: consecrationDate, location: consecrationLocation, principalConsecrator, principalCHId, coConsecrators }
    : null

  return {
    assignments,
    consecration,
    birthDate,
    deathDate,
    birthPlace: microBirthPlace,
  }
}

async function main() {
  const inputFile = process.argv[2]
  if (!inputFile) {
    process.stderr.write('Usage: npx tsx scripts/fetch-ch.ts <bishops-wikidata.json>\n')
    process.exit(1)
  }

  const bishops: BishopWikidata[] = JSON.parse(fs.readFileSync(inputFile, 'utf-8'))
  const withChId    = bishops.filter(b => b.chId)
  const withoutChId = bishops.filter(b => !b.chId)

  process.stderr.write(`${bishops.length} total, ${withChId.length} have CH IDs — fetching…\n`)

  const results: BishopFull[] = []

  for (let i = 0; i < withChId.length; i++) {
    const bishop = withChId[i]
    process.stderr.write(`[${i + 1}/${withChId.length}] ${bishop.label} (${bishop.chId})\n`)

    try {
      const ch = await fetchBishopPage(bishop.chId!)
      results.push({
        ...bishop,
        chAssignments:  ch.assignments,
        chConsecration: ch.consecration,
        chBirthDate:    ch.birthDate,
        chDeathDate:    ch.deathDate,
        chBirthPlace:   ch.birthPlace,
        chFetchError:   null,
      })
    } catch (err) {
      process.stderr.write(`  ERROR: ${err instanceof Error ? err.message : String(err)}\n`)
      results.push({
        ...bishop,
        chAssignments:  [],
        chConsecration: null,
        chBirthDate:    null,
        chDeathDate:    null,
        chBirthPlace:   null,
        chFetchError:   err instanceof Error ? err.message : String(err),
      })
    }

    if (i < withChId.length - 1) await sleep(DELAY_MS)
  }

  for (const bishop of withoutChId) {
    results.push({
      ...bishop,
      chAssignments:  [],
      chConsecration: null,
      chBirthDate:    null,
      chDeathDate:    null,
      chBirthPlace:   null,
      chFetchError:   'no CH ID',
    })
  }

  process.stdout.write(JSON.stringify(results, null, 2) + '\n')
  process.stderr.write(`Done. ${results.length} bishops written.\n`)
}

main().catch(err => { console.error(err); process.exit(1) })
