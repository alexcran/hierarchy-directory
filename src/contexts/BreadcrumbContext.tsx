'use client'
import { createContext, useContext, useState, useCallback } from 'react'

interface BreadcrumbContextValue {
  overrideLabel: string | null
  setOverrideLabel: (label: string | null) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  overrideLabel: null,
  setOverrideLabel: () => {},
})

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [overrideLabel, setOverrideLabelRaw] = useState<string | null>(null)
  const setOverrideLabel = useCallback((label: string | null) => setOverrideLabelRaw(label), [])
  return (
    <BreadcrumbContext.Provider value={{ overrideLabel, setOverrideLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export const useBreadcrumb = () => useContext(BreadcrumbContext)
