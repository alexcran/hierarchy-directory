'use client'
import Link from 'next/link'
import { useSelection } from '@/contexts/SelectionContext'

export function SelectionBar() {
  const { count, clear } = useSelection()
  if (count === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border shadow-lg">
      <div className="h-14 max-w-content mx-auto px-6 flex items-center justify-between">
        <span className="text-sm font-body text-text-secondary">
          <span className="font-semibold text-text-primary">{count}</span>{' '}
          {count === 1 ? 'bishop' : 'bishops'} selected
        </span>
        <div className="flex items-center gap-4">
          <button
            onClick={clear}
            className="text-sm font-body text-text-secondary hover:text-text-primary transition-colors"
          >
            Clear selection
          </button>
          <Link
            href="/build-directory"
            className="px-4 py-2 text-sm font-body font-semibold text-white bg-burgundy hover:bg-burgundy-hover rounded-md transition-colors"
          >
            Build Directory
          </Link>
        </div>
      </div>
    </div>
  )
}
