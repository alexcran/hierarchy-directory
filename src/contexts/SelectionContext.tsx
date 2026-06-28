'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface SelectionCtx {
  selectedIds: Set<string>
  count: number
  toggle: (id: string) => void
  clear: () => void
  isSelected: (id: string) => boolean
  ready: boolean
}

const Ctx = createContext<SelectionCtx | null>(null)
const STORAGE_KEY = 'hd-selection'

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try { setIds(new Set(JSON.parse(raw) as string[])) } catch { /* ignore */ }
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)))
  }, [ids, ready])

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clear = useCallback(() => setIds(new Set()), [])
  const isSelected = useCallback((id: string) => ids.has(id), [ids])

  return (
    <Ctx.Provider value={{ selectedIds: ids, count: ids.size, toggle, clear, isSelected, ready }}>
      {children}
    </Ctx.Provider>
  )
}

export function useSelection() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSelection must be within SelectionProvider')
  return ctx
}
