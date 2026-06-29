export interface LaicizationFields {
  laicizedDate?: Date | string | null
  laicizationReason?: string | null
}

export interface CardinalateStatusFields {
  cardinalate?: {
    dateEnded?: Date | string | null
  } | null
}

export function isLaicized(person: LaicizationFields): boolean {
  return !!person.laicizedDate
}

export function isCurrentCardinal(person: CardinalateStatusFields): boolean {
  return !!person.cardinalate && !person.cardinalate.dateEnded
}

export function formatLaicizationReason(reason: string | null | undefined): string {
  switch (reason) {
    case 'dismissed_from_clerical_state':
      return 'Dismissed from the clerical state'
    case 'dispensed_from_clerical_state':
      return 'Dispensed from the clerical state'
    case 'laicized':
    default:
      return 'Laicized'
  }
}

export function formatCardinalateEndReason(reason: string | null | undefined): string {
  switch (reason) {
    case 'resigned_from_cardinalate':
      return 'Resigned from the College of Cardinals'
    case 'removed_from_cardinalate':
      return 'Removed from the College of Cardinals'
    case 'renounced_cardinalate':
      return 'Renounced the cardinalate'
    default:
      return 'Left the College of Cardinals'
  }
}
