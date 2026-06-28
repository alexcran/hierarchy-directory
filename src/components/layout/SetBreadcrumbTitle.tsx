'use client'
import { useEffect } from 'react'
import { useBreadcrumb } from '@/contexts/BreadcrumbContext'

export function SetBreadcrumbTitle({ title }: { title: string }) {
  const { setOverrideLabel } = useBreadcrumb()
  useEffect(() => {
    setOverrideLabel(title)
    return () => setOverrideLabel(null)
  }, [title, setOverrideLabel])
  return null
}
