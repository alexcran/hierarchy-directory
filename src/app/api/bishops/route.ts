import { NextResponse } from 'next/server'
import { getBishops, type BishopsFilters, type BishopSort } from '@/lib/queries/bishops'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')

    const filters: BishopsFilters = {
      search:          searchParams.get('search')          ?? undefined,
      status:          statusParam === 'all'
                         ? []
                         : statusParam?.split(',').filter(Boolean) ?? ['living'],
      rank:            searchParams.get('rank')?.split(',').filter(Boolean),
      riteIds:         searchParams.get('rite')?.split(',').filter(Boolean),
      countryId:       searchParams.get('country')         ?? undefined,
      state:           searchParams.get('state')           ?? undefined,
      provinceId:      searchParams.get('province')        ?? undefined,
      dioceseId:       searchParams.get('diocese')         ?? undefined,
      religiousOrder:  searchParams.get('religiousOrder') ?? searchParams.get('religious_order') ?? undefined,
      isElector:       searchParams.get('is_elector') === '1' ? true : undefined,
      consecratedById: searchParams.get('consecrated_by')  ?? undefined,
      consecratedAfter:  toYear(searchParams.get('consecrated_after')),
      consecratedBefore: toYear(searchParams.get('consecrated_before')),
      ageMin:            toAge(searchParams.get('age_min')),
      ageMax:            toAge(searchParams.get('age_max')),
      appointmentPope: searchParams.get('pope')            ?? undefined,
      ordinationAfter:   toYear(searchParams.get('ordination_after')),
      ordinationBefore:  toYear(searchParams.get('ordination_before')),
    }

    const sortParam = searchParams.get('sort') ?? 'appointment_date'
    // backward-compat: old 'recently_appointed' param maps to 'appointment_date'
    const sort = (sortParam === 'recently_appointed' ? 'appointment_date' : sortParam) as BishopSort
    const dir  = (searchParams.get('dir') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc'
    const page    = Math.max(1, Number(searchParams.get('page')     ?? '1'))
    const perPage = Math.min(200, Math.max(1, Number(searchParams.get('per_page') ?? '48')))

    const result = await getBishops(filters, sort, page, perPage, dir)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[GET /api/bishops]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function toYear(value: string | null): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isFinite(n) && n > 1000 && n < 2200 ? n : undefined
}

function toAge(value: string | null): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 && n <= 120 ? n : undefined
}
