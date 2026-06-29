export function computeStyleOfAddress(opts: {
  styleOfAddress: string | null | undefined
  isCardinal: boolean
  currentRole: string | null | undefined
  riteType: string | null | undefined
  hasEpiscopalConsecration?: boolean
  isLaicized?: boolean
}): string {
  if (opts.isLaicized) return ''
  if (opts.styleOfAddress) return opts.styleOfAddress
  if (opts.isCardinal) return 'His Eminence'
  const role = opts.currentRole
  if ((role === 'bishop_elect' || role === 'archbishop_elect' || role === 'auxiliary_bishop_elect') && !opts.hasEpiscopalConsecration) {
    return 'Reverend'
  }
  if (role === 'patriarch' || role === 'major_archbishop') return 'His Beatitude'
  if (role === 'metropolitan' && opts.riteType === 'eastern') return 'His Grace'
  return 'His Excellency'
}

export function getStyleOfAddressColor(styleOfAddress: string): string {
  if (!styleOfAddress) return '#1A1714'
  return styleOfAddress === 'His Eminence' ? '#C41E3A' : '#007A00'
}
