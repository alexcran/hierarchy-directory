export const ELECT_ROLES = ['bishop_elect', 'archbishop_elect', 'auxiliary_bishop_elect']
export const ORDINARY_ROLES = ['ordinary', 'diocesan_bishop', 'archbishop', 'bishop_elect', 'archbishop_elect']
export const AUXILIARY_ROLES = ['auxiliary', 'auxiliary_bishop_elect']
export const EMERITUS_ROLES = ['archbishop_emeritus', 'bishop_emeritus', 'auxiliary_emeritus', 'coadjutor_emeritus']

export function isElectRole(role: string | null | undefined): boolean {
  return !!role && ELECT_ROLES.includes(role)
}

export function convertElectRole(role: string): string {
  switch (role) {
    case 'bishop_elect': return 'diocesan_bishop'
    case 'archbishop_elect': return 'archbishop'
    case 'auxiliary_bishop_elect': return 'auxiliary'
    default: return role
  }
}
