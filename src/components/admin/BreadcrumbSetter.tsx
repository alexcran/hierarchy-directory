'use client'
import { useEffect } from 'react'
import { useBreadcrumb } from '@/contexts/BreadcrumbContext'

export function BreadcrumbSetter({ label }: { label: string }) {
  const { setOverrideLabel } = useBreadcrumb()
  useEffect(() => {
    setOverrideLabel(label)
    return () => setOverrideLabel(null)
  }, [label, setOverrideLabel])
  return null
}
