/**
 * Pulls US Catholic bishops from Wikidata via SPARQL.
 * Outputs a JSON array to stdout — pipe to data/bishops-wikidata.json.
 *
 * Usage: npx tsx scripts/fetch-wikidata.ts > data/bishops-wikidata.json
 */

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql'

// Returns all humans with P108 (employer) or P39 (position held) linking to a US Catholic diocese,
// or directly classed as Catholic bishops (Q611644) with P27 = United States.
// We cast a wide net and filter in the transform step.
const QUERY = `
SELECT DISTINCT
  ?person ?personLabel
  ?firstName ?lastName
  ?birthDate ?birthPlace ?birthPlaceLabel
  ?deathDate
  ?chId
  ?wikidataId
  ?wikipediaUrl
  ?ordination
  ?consecration
  ?religiousOrder ?religiousOrderLabel
WHERE {
  # Catholic bishop or archbishop or cardinal
  ?person wdt:P31 wd:Q5 .
  ?person wdt:P106/wdt:P279* wd:Q611644 .   # occupation = Catholic bishop (or subclass)
  ?person wdt:P27 wd:Q30 .                    # country of citizenship = United States

  OPTIONAL { ?person wdt:P1047 ?chId . }      # Catholic-Hierarchy ID
  OPTIONAL { ?person wdt:P569 ?birthDate . }
  OPTIONAL { ?person wdt:P570 ?deathDate . }
  OPTIONAL { ?person wdt:P19 ?birthPlace . }
  OPTIONAL { ?person wdt:P26931 ?ordination . } # date of priestly ordination (custom)
  OPTIONAL { ?person wdt:P1135 ?consecration . } # date of episcopal consecration

  # Given name → firstName approximation
  OPTIONAL {
    ?person wdt:P735 ?fnEntity .
    ?fnEntity wdt:P31/wdt:P279* wd:Q202444 .
    ?fnEntity rdfs:label ?firstName FILTER(LANG(?firstName) = "en")
  }
  # Family name
  OPTIONAL {
    ?person wdt:P734 ?lnEntity .
    ?lnEntity rdfs:label ?lastName FILTER(LANG(?lastName) = "en")
  }
  # Religious order
  OPTIONAL { ?person wdt:P140 ?religiousOrder . }

  # Wikipedia English article URL
  OPTIONAL {
    ?wikipediaUrl schema:about ?person ;
                  schema:isPartOf <https://en.wikipedia.org/> .
  }

  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "en" .
  }
}
ORDER BY ?lastName ?firstName
`

interface WikidataBinding {
  value: string
  type: string
  'xml:lang'?: string
}

interface WikidataResult {
  person:              WikidataBinding
  personLabel:         WikidataBinding
  firstName?:          WikidataBinding
  lastName?:           WikidataBinding
  birthDate?:          WikidataBinding
  birthPlace?:         WikidataBinding
  birthPlaceLabel?:    WikidataBinding
  deathDate?:          WikidataBinding
  chId?:               WikidataBinding
  wikidataId?:         WikidataBinding
  wikipediaUrl?:       WikidataBinding
  ordination?:         WikidataBinding
  consecration?:       WikidataBinding
  religiousOrder?:     WikidataBinding
  religiousOrderLabel?: WikidataBinding
}

export interface BishopWikidata {
  wikidataId:       string        // Q-ID e.g. "Q12345"
  wikidataUrl:      string
  label:            string        // full name from Wikidata label
  firstName:        string | null
  lastName:         string | null
  birthDate:        string | null // ISO date
  birthPlaceLabel:  string | null
  deathDate:        string | null // ISO date or null
  chId:             string | null // Catholic-Hierarchy ID
  wikipediaUrl:     string | null
  ordinationDate:   string | null
  consecrationDate: string | null
  religiousOrder:   string | null
}

function isoDate(raw: string | undefined): string | null {
  if (!raw) return null
  // Wikidata dates look like "+1945-03-15T00:00:00Z" or "1945-03-15T00:00:00Z"
  const match = raw.replace(/^\+/, '').match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : null
}

function qid(url: string): string {
  return url.split('/').pop() ?? url
}

async function fetchWikidata(): Promise<BishopWikidata[]> {
  const url = new URL(SPARQL_ENDPOINT)
  url.searchParams.set('query', QUERY)
  url.searchParams.set('format', 'json')

  process.stderr.write('Querying Wikidata SPARQL…\n')

  const res = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/sparql-results+json',
      'User-Agent': 'HierarchyDirectory/1.0 (https://hierarchy.directory; ac@alexcran.com)',
    },
  })

  if (!res.ok) {
    throw new Error(`Wikidata SPARQL error: ${res.status} ${await res.text()}`)
  }

  const json = await res.json() as { results: { bindings: WikidataResult[] } }
  const bindings = json.results.bindings

  process.stderr.write(`Got ${bindings.length} raw rows from Wikidata\n`)

  // Deduplicate by Wikidata ID — SPARQL can return multiple rows per person
  // (one per optional field that has multiple values). Take first occurrence.
  const seen = new Map<string, BishopWikidata>()
  for (const b of bindings) {
    const id = qid(b.person.value)
    if (seen.has(id)) continue

    seen.set(id, {
      wikidataId:       id,
      wikidataUrl:      b.person.value,
      label:            b.personLabel?.value ?? '',
      firstName:        b.firstName?.value ?? null,
      lastName:         b.lastName?.value ?? null,
      birthDate:        isoDate(b.birthDate?.value),
      birthPlaceLabel:  b.birthPlaceLabel?.value ?? null,
      deathDate:        isoDate(b.deathDate?.value),
      chId:             b.chId?.value ?? null,
      wikipediaUrl:     b.wikipediaUrl?.value ?? null,
      ordinationDate:   isoDate(b.ordination?.value),
      consecrationDate: isoDate(b.consecration?.value),
      religiousOrder:   b.religiousOrderLabel?.value ?? null,
    })
  }

  const results = Array.from(seen.values())
  process.stderr.write(`Deduplicated to ${results.length} unique bishops\n`)
  return results
}

async function main() {
  const results = await fetchWikidata()
  process.stdout.write(JSON.stringify(results, null, 2) + '\n')
}

main().catch(err => { console.error(err); process.exit(1) })
