'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FilterGroupProps {
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function FilterGroup({ label, children, defaultOpen = true }: FilterGroupProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 text-xs font-body font-semibold text-text-primary uppercase tracking-wide"
      >
        {label}
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-tertiary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="pb-3 space-y-1">{children}</div>}
    </div>
  )
}
