export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-[6px] bg-[color:var(--color-gray-200)] ${className}`}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`ds-card ds-card-pad ${className}`}
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-4 w-1/3 mb-4" />
      <Skeleton className="h-8 w-1/2 mb-3" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  )
}

export function SkeletonList({ count = 3, className = '' }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="border border-[color:var(--color-border-soft)] rounded-[8px] px-5 py-4 flex items-center gap-3 bg-[color:var(--color-card-surface)]">
          <Skeleton className="w-5 h-5 shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonRewardGrid({ count = 4, className = '' }) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 ${className}`}
      aria-busy="true"
      aria-label="Loading rewards"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="ds-card ds-card-pad flex flex-col gap-3">
          <Skeleton className="h-32 w-full rounded-[8px]" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-full rounded-[8px] mt-2" />
        </div>
      ))}
    </div>
  )
}
