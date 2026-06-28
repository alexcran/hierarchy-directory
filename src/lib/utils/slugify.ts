export function slugifyPerson(firstName: string, middleName: string | null | undefined, lastName: string): string {
  const parts = [firstName]
  if (middleName?.trim()) parts.push(middleName.trim().charAt(0))
  parts.push(lastName)
  return slugify(parts.join(' '))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['‘’]/g, '')  // strip apostrophes
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function unslugify(slug: string): string {
  return slug.replace(/-/g, ' ')
}
