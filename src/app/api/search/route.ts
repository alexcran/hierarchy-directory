import { NextResponse } from 'next/server'
import { typeaheadSearch } from '@/lib/queries/search'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') ?? ''

    if (q.length < 2) {
      return NextResponse.json({ bishops: [], dioceses: [] })
    }

    const result = await typeaheadSearch(q)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[GET /api/search]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
