export interface BishopEntry {
  id: string
  slug: string
  displayName: string
  firstName: string
  lastName: string
  portraitUrl: string | null
  isCardinal: boolean
  // Current Role
  currentRole: string | null
  currentTitle: string | null
  currentSee: string | null
  styleOfAddress: string
  // Biographical
  dateOfBirth: string | null
  placeOfBirth: string | null
  dateOfDeath: string | null
  // Ordination
  priestOrdDate: string | null
  priestOrdLocation: string | null
  episcopalConsDate: string | null
  episcopalConsLocation: string | null
  principalConsecrator: string | null
  // Other
  religiousOrder: string | null
  rite: string | null
  education: string | null
}

export interface DirectoryFields {
  // Current Role group
  diocese: boolean
  title: boolean
  styleOfAddress: boolean
  // Biographical group
  dateOfBirth: boolean
  placeOfBirth: boolean
  dateOfDeath: boolean
  // Ordination group
  priestOrdDate: boolean
  priestOrdLocation: boolean
  episcopalConsDate: boolean
  episcopalConsLocation: boolean
  principalConsecrator: boolean
  // Other group
  rite: boolean
  education: boolean
}

export interface DirectoryConfig {
  fields: DirectoryFields
  gridDensity: 'large' | 'medium' | 'compact'
  sort: 'alphabetical' | 'see' | 'seniority' | 'manual'
  coverPage: boolean
  coverTitle: string
  coverSubtitle: string
  pageSize: 'letter' | 'a4'
}
