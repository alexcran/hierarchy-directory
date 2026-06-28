import { DioceseRowSkeleton, SkeletonBlock } from '@/components/ui/Skeleton'

export default function DiocesesLoading() {
  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-6 pb-24">
      <div className="mb-5">
        <SkeletonBlock className="h-9 w-48 mb-2" />
        <SkeletonBlock className="h-4 w-36" />
      </div>
      <div className="flex gap-6 items-start">
        <aside className="hidden sm:block w-60 flex-shrink-0">
          <div className="space-y-5">
            <SkeletonBlock className="h-9 w-full rounded-lg" />
            <SkeletonBlock className="h-28 w-full rounded-lg" />
            <SkeletonBlock className="h-24 w-full rounded-lg" />
            <SkeletonBlock className="h-20 w-full rounded-lg" />
          </div>
        </aside>
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 border-b border-border mb-4">
            <SkeletonBlock className="h-9 w-20 rounded-none" />
            <SkeletonBlock className="h-9 w-24 rounded-none" />
            <SkeletonBlock className="h-9 w-28 rounded-none" />
          </div>
          <SkeletonBlock className="h-4 w-52 mb-4" />
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            {Array.from({ length: 10 }).map((_, i) => (
              <DioceseRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
