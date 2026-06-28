export function getInitials(name: string): string {
  const clean = name
    .replace(/^Most Rev\.\s+/, '')
    .replace(/,.*$/, '')
    .trim()
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0] ?? ''
  const last = parts[parts.length - 1][0] ?? ''
  return (first + last).toUpperCase()
}
