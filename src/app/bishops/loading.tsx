import { BishopCardSkeleton, SkeletonBlock } from '@/components/ui/Skeleton'

export default function BishopsLoading() {
  return (
    <div className="max-w-content mx-auto px-6 py-6 pb-24">
      <div className="flex gap-8">
        <aside className="hidden md:block w-60 flex-shrink-0">
          <SkeletonBlock className="h-64 w-full rounded-lg" />
        </aside>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <SkeletonBlock className="h-4 w-36" />
            <SkeletonBlock className="h-8 w-44 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {Array.from({ length: 20 }).map((_, i) => (
              <BishopCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
