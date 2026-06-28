interface NameFields {
  firstName: string
  middleName?: string | null
  lastName: string
  suffix?: string | null
  religiousOrder?: string | { abbreviation: string } | null
}

interface FormatNameOptions {
  /** Prepend "Most Rev." — default true, ignored when isCardinal is true */
  honorific?: boolean
  honorificLabel?: string
  /** Abbreviate middle name to initial — default true, ignored when isCardinal is true */
  abbreviateMiddle?: boolean
  /**
   * Use cardinal name format: "First Cardinal Last[, Religious Order]"
   * Drops honorific and middle name regardless of other options.
   */
  isCardinal?: boolean
}

/**
 * Formats a bishop's display name.
 *
 * formatName(bishop)
 *   → "Most Rev. William E. Lori"
 *
 * formatName(cardinal, { isCardinal: true })
 *   → "Seán Cardinal O'Malley, O.F.M. Cap."
 *
 * formatName(bishop, { honorific: false })
 *   → "William E. Lori"
 */
export function formatName(
  person: NameFields,
  options: FormatNameOptions = {},
): string {
  const { honorific = true, honorificLabel = 'Most Rev.', abbreviateMiddle = true, isCardinal = false } = options

  const orderStr = typeof person.religiousOrder === 'string'
    ? person.religiousOrder
    : (person.religiousOrder?.abbreviation ?? null)

  if (isCardinal) {
    let result = `${person.firstName} Cardinal ${person.lastName}`
    if (person.suffix) result += `, ${person.suffix}`
    if (orderStr) result += `, ${orderStr}`
    return result
  }

  const parts: string[] = []
  if (honorific) parts.push(honorificLabel)
  parts.push(person.firstName)

  if (person.middleName) {
    const mid = person.middleName.trim()
    parts.push(abbreviateMiddle ? `${mid.charAt(0)}.` : mid)
  }

  parts.push(person.lastName)

  let result = parts.join(' ')
  if (person.suffix) result += `, ${person.suffix}`
  if (orderStr) result += `, ${orderStr}`

  return result
}
