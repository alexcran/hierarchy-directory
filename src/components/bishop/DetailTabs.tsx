'use client'
import { useState } from 'react'

interface Tab {
  id: string
  label: string
  count?: number
}

interface DetailTabsProps {
  tabs: Tab[]
  panels: Record<string, React.ReactNode>
  defaultTab?: string
}

export function DetailTabs({ tabs, panels, defaultTab }: DetailTabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? '')
  return (
    <div>
      <div className="border-b border-border mb-6">
        <div className="flex gap-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`px-5 py-3 text-sm font-body font-medium border-b-2 transition-colors -mb-px ${
                active === tab.id
                  ? 'border-burgundy text-burgundy'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-xs text-text-tertiary">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>
      {panels[active]}
    </div>
  )
}
