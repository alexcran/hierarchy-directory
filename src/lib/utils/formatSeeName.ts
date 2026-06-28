/**
 * Returns the full display name for a See.
 *
 * "Baltimore" + "archdiocese"           → "Archdiocese of Baltimore"
 * "Military Services" + "archdiocese" + "for the" → "Archdiocese for the Military Services"
 * "Springfield" + "diocese"             → "Diocese of Springfield"
 * "Nova Germania" + "titular_see"       → "Titular See of Nova Germania"
 */
function seeTypeToLabel(seeType: string): string {
  return seeType
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function formatSeeName(
  name: string,
  seeType: string,
  namePrefixOverride?: string | null,
): string {
  const prefix = namePrefixOverride ?? 'of'
  return `${seeTypeToLabel(seeType)} ${prefix} ${name}`
}
