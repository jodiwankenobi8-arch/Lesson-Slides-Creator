/**
 * Skeleton loading component
 * Provides a better UX than spinners by showing the shape of content that's loading
 */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse rounded ${className}`}
      style={{ backgroundColor: 'var(--ao-border)' }}
      aria-label="Loading..."
    />
  );
}

export function LessonCardSkeleton() {
  return (
    <div className="rounded-lg p-6 space-y-4" style={{ border: '2px solid var(--ao-border)' }}>
      <div className="flex items-start justify-between">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: 'var(--ao-cream)' }}>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  );
}

export function FileCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3" style={{ borderColor: 'var(--ao-border)' }}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function StepPanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}