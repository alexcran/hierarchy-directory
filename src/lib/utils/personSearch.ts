import { type Prisma } from '@prisma/client'

function searchTokens(query: string): string[] {
  return query
    .trim()
    .replace(/[.,]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

export function buildPersonNameSearchWhere(query: string): Prisma.PersonWhereInput {
  const tokens = searchTokens(query)
  if (tokens.length === 0) return {}

  return {
    AND: tokens.map(token => ({
      OR: [
        { firstName: { contains: token, mode: 'insensitive' } },
        { middleName: { contains: token, mode: 'insensitive' } },
        { lastName: { contains: token, mode: 'insensitive' } },
      ],
    })),
  }
}
