'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'

export interface Filters {
  search: string
  status: string[]
  rank: string[]
  sort: string
  dir: string
  page: number
  // Location
  state: string
  dioceseId: string
  provinceId: string
  // Identity
  riteIds: string[]
  religiousOrder: string
  isElector: boolean
  // Age
  ageMin: string
  ageMax: string
  // Research
  appointmentPope: string
  consecratedById: string
  consecratedByName: string
  consecratedAfter: string
  consecratedBefore: string
  ordinationAfter: string
  ordinationBefore: string
}

const RESET_PAGE_KEYS: (keyof Filters)[] = [
  'search', 'status', 'rank',
  'state', 'dioceseId', 'provinceId',
  'riteIds', 'religiousOrder', 'isElector',
  'ageMin', 'ageMax',
  'appointmentPope', 'consecratedById', 'consecratedByName',
  'consecratedAfter', 'consecratedBefore',
  'ordinationAfter', 'ordinationBefore',
]

export function useFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const statusParam = searchParams.get('status')

  const filters: Filters = useMemo(() => ({
    search:            searchParams.get('search')              ?? '',
    status:            statusParam === 'all'
                         ? []
                         : statusParam?.split(',').filter(Boolean) ?? ['living'],
    rank:              searchParams.get('rank')?.split(',').filter(Boolean)    ?? [],
    sort:              searchParams.get('sort')                ?? 'appointment_date',
    dir:               searchParams.get('dir')                ?? 'desc',
    page:              Math.max(1, Number(searchParams.get('page') ?? '1')),
    state:             searchParams.get('state')               ?? '',
    dioceseId:         searchParams.get('diocese')             ?? '',
    provinceId:        searchParams.get('province')            ?? '',
    riteIds:           searchParams.get('rite')?.split(',').filter(Boolean)    ?? [],
    religiousOrder:    searchParams.get('religiousOrder') ?? searchParams.get('religious_order') ?? '',
    isElector:         searchParams.get('is_elector')          === '1',
    ageMin:            searchParams.get('age_min')             ?? '',
    ageMax:            searchParams.get('age_max')             ?? '',
    appointmentPope:   searchParams.get('pope')                ?? '',
    consecratedById:   searchParams.get('consecrated_by')      ?? '',
    consecratedByName: searchParams.get('consecrated_by_name') ?? '',
    consecratedAfter:  searchParams.get('consecrated_after')   ?? '',
    consecratedBefore: searchParams.get('consecrated_before')  ?? '',
    ordinationAfter:   searchParams.get('ordination_after')    ?? '',
    ordinationBefore:  searchParams.get('ordination_before')   ?? '',
  }), [searchParams, statusParam])

  const setFilters = useCallback((updates: Partial<Filters>) => {
    const params = new URLSearchParams(searchParams.toString())

    function set(key: string, val: string | undefined) {
      if (val) params.set(key, val); else params.delete(key)
    }
    function setArr(key: string, arr: string[] | undefined) {
      if (arr?.length) params.set(key, arr.join(',')); else params.delete(key)
    }
    function setStatus(arr: string[] | undefined) {
      if (arr?.length) params.set('status', arr.join(','))
      else params.set('status', 'all')
    }
    function setBool(key: string, val: boolean | undefined) {
      if (val) params.set(key, '1'); else params.delete(key)
    }

    if ('search'            in updates) set('search',               updates.search)
    if ('status'            in updates) setStatus(updates.status)
    if ('rank'              in updates) setArr('rank',              updates.rank)
    if ('state'             in updates) set('state',                updates.state)
    if ('dioceseId'         in updates) set('diocese',              updates.dioceseId)
    if ('provinceId'        in updates) set('province',             updates.provinceId)
    if ('riteIds'           in updates) setArr('rite',              updates.riteIds)
    if ('religiousOrder'    in updates) {
      params.delete('religious_order')
      set('religiousOrder', updates.religiousOrder)
    }
    if ('isElector'         in updates) setBool('is_elector',       updates.isElector)
    if ('ageMin'            in updates) set('age_min',              updates.ageMin)
    if ('ageMax'            in updates) set('age_max',              updates.ageMax)
    if ('appointmentPope'   in updates) set('pope',                 updates.appointmentPope)
    if ('consecratedById'   in updates) set('consecrated_by',       updates.consecratedById)
    if ('consecratedByName' in updates) set('consecrated_by_name',  updates.consecratedByName)
    if ('consecratedAfter'  in updates) set('consecrated_after',    updates.consecratedAfter)
    if ('consecratedBefore' in updates) set('consecrated_before',   updates.consecratedBefore)
    if ('ordinationAfter'   in updates) set('ordination_after',     updates.ordinationAfter)
    if ('ordinationBefore'  in updates) set('ordination_before',    updates.ordinationBefore)
    if ('sort' in updates) {
      if (updates.sort && updates.sort !== 'appointment_date') params.set('sort', updates.sort)
      else params.delete('sort')
    }
    if ('dir' in updates) {
      // 'desc' is the default; omit from URL when default
      if (updates.dir && updates.dir !== 'desc') params.set('dir', updates.dir)
      else params.delete('dir')
    }
    if ('page' in updates) {
      if ((updates.page ?? 1) > 1) params.set('page', String(updates.page))
      else params.delete('page')
    }

    if (RESET_PAGE_KEYS.some(k => k in updates)) params.delete('page')

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])

  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [router, pathname])

  const hasActiveFilters = !!(
    filters.search ||
    (filters.status.length && !(filters.status.length === 1 && filters.status[0] === 'living' && !searchParams.has('status'))) ||
    filters.rank.length ||
    filters.state ||
    filters.dioceseId ||
    filters.provinceId ||
    filters.riteIds.length ||
    filters.religiousOrder ||
    filters.isElector ||
    filters.ageMin ||
    filters.ageMax ||
    filters.appointmentPope ||
    filters.consecratedById ||
    filters.consecratedAfter ||
    filters.consecratedBefore ||
    filters.ordinationAfter ||
    filters.ordinationBefore
  )

  return { filters, setFilters, clearAll, hasActiveFilters }
}
