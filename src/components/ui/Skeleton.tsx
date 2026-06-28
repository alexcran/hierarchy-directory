import type { CSSProperties } from 'react'

export function SkeletonBlock({
  className = '',
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return <div aria-hidden="true" className={`skeleton-shimmer rounded-md ${className}`} style={style} />
}

export function BishopCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden border border-border shadow-sm bg-white">
      <div className="h-[3px] skeleton-shimmer" />
      <SkeletonBlock className="w-full rounded-none" style={{ aspectRatio: '3 / 4' }} />
      <div className="px-3 py-2.5 space-y-1.5">
        <SkeletonBlock className="h-3.5 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
        <SkeletonBlock className="h-3 w-2/3" />
      </div>
    </div>
  )
}

export function DioceseRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-border px-4 py-3">
      <div className="min-w-0 flex-1 space-y-1.5">
        <SkeletonBlock className="h-4 w-56 max-w-full" />
        <SkeletonBlock className="h-3 w-32 max-w-[70%]" />
      </div>
      <SkeletonBlock className="hidden sm:block h-4 w-36 flex-shrink-0" />
    </div>
  )
}

export function BishopDetailSkeleton() {
  return (
    <div className="max-w-content mx-auto px-6 py-8 pb-24">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <SkeletonBlock className="h-[320px] w-[240px] max-w-full rounded-lg" />
        <div className="space-y-4 pt-2">
          <SkeletonBlock className="h-8 w-72 max-w-full" />
          <SkeletonBlock className="h-5 w-56 max-w-[85%]" />
          <SkeletonBlock className="h-5 w-80 max-w-full" />
          <div className="grid gap-3 sm:grid-cols-2 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-10 max-w-3xl">
        <SkeletonBlock className="h-6 w-40 mb-5" />
        <div className="relative border-l border-border pl-6 space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="relative">
              <SkeletonBlock className="absolute -left-[31px] top-0 h-3 w-3 rounded-full" />
              <SkeletonBlock className="h-4 w-44 mb-2" />
              <SkeletonBlock className="h-3 w-72 max-w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DioceseDetailSkeleton() {
  return (
    <div className="max-w-content mx-auto px-6 py-8 pb-24">
      <SkeletonBlock className="h-9 w-80 max-w-full mb-3" />
      <SkeletonBlock className="h-4 w-56 max-w-[80%] mb-8" />
      <div className="grid gap-4 sm:grid-cols-2 max-w-3xl mb-10">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-4">
            <div className="flex gap-4">
              <SkeletonBlock className="h-28 w-20 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <SkeletonBlock className="h-4 w-36 max-w-full" />
                <SkeletonBlock className="h-3 w-28 max-w-[80%]" />
                <SkeletonBlock className="h-3 w-44 max-w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border border-border rounded-lg overflow-hidden max-w-4xl">
        {Array.from({ length: 8 }).map((_, i) => (
          <DioceseRowSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
