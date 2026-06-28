'use client'
import { useSelection } from '@/contexts/SelectionContext'

export function SelectBishopButton({ id, name }: { id: string; name: string }) {
  const { isSelected, toggle } = useSelection()
  const selected = isSelected(id)
  return (
    <button
      onClick={() => toggle(id)}
      aria-label={selected ? `Remove ${name} from selection` : `Add ${name} to selection`}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-body font-semibold rounded-md transition-colors ${
        selected
          ? 'bg-burgundy text-white hover:bg-burgundy-hover'
          : 'border border-burgundy text-burgundy hover:bg-burgundy/10'
      }`}
    >
      <svg className="w-4 h-4" fill={selected ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={selected ? 0 : 1.5}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      {selected ? 'Selected' : 'Select for Directory'}
    </button>
  )
}
