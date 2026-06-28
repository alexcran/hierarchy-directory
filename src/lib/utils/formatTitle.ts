export function formatRoleTitle(role: string, seeName: string): string {
  switch (role) {
    case 'ordinary':
    case 'diocesan_bishop':
      if (seeName.startsWith('Archdiocese') || seeName.startsWith('Apostolic Exarchate')) return 'Archbishop'
      if (seeName.startsWith('Eparchy')) return 'Eparch'
      return 'Bishop'
    case 'auxiliary':
      return 'Auxiliary Bishop'
    case 'bishop_elect':
      return `Bishop-elect of ${seeName}`
    case 'archbishop_elect':
      return `Archbishop-elect of ${seeName}`
    case 'auxiliary_bishop_elect':
      return `Auxiliary Bishop-elect of ${seeName}`
    case 'coadjutor':
      if (seeName.startsWith('Archdiocese')) return 'Coadjutor Archbishop'
      return 'Coadjutor Bishop'
    case 'apostolic_administrator':
      return 'Apostolic Administrator'
    case 'apostolic_nuncio':
      return 'Apostolic Nuncio'
    case 'curial_prefect':
      return 'Prefect'
    case 'curial_secretary':
      return 'Secretary'
    case 'curial_president':
      return `President of ${seeName}`
    case 'curial_member':
      return `Member of ${seeName}`
    case 'papal_legate':
      return `Papal Legate to ${seeName}`
    case 'vicar_general':
      return `Vicar General of ${seeName}`
    case 'archpriest':
      return `Archpriest of ${seeName}`
    case 'archbishop_emeritus': {
      const loc = seeName.replace(/^.+? of /, '')
      return loc && loc !== seeName ? `Archbishop Emeritus of ${loc}` : 'Archbishop Emeritus'
    }
    case 'bishop_emeritus': {
      const loc = seeName.replace(/^.+? of /, '')
      return loc && loc !== seeName ? `Bishop Emeritus of ${loc}` : 'Bishop Emeritus'
    }
    case 'auxiliary_emeritus': {
      const loc = seeName.replace(/^.+? of /, '')
      return loc && loc !== seeName ? `Auxiliary Bishop Emeritus of ${loc}` : 'Auxiliary Bishop Emeritus'
    }
    case 'coadjutor_emeritus': {
      const loc = seeName.replace(/^.+? of /, '')
      return loc && loc !== seeName ? `Coadjutor Bishop Emeritus of ${loc}` : 'Coadjutor Bishop Emeritus'
    }
    default:
      return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }
}

export function getRankColor(isCardinal: boolean): string {
  return isCardinal ? '#C41E3A' : '#007A00'
}
