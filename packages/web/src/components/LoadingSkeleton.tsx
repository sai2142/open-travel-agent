'use client';

export function FlightCardSkeleton() {
  return (
    <div className="glass p-5 space-y-4">
      <div className="flex justify-between">
        <div className="skeleton w-16 h-5" />
        <div className="skeleton w-24 h-7" />
      </div>
      <div className="flex items-center gap-4">
        <div className="skeleton w-12 h-4" />
        <div className="flex-1 flex items-center gap-2">
          <div className="skeleton w-16 h-10" />
          <div className="flex-1 skeleton h-px" />
          <div className="skeleton w-16 h-10" />
        </div>
        <div className="skeleton w-20 h-8" />
      </div>
      <div className="flex items-center gap-4">
        <div className="skeleton w-12 h-4" />
        <div className="flex-1 flex items-center gap-2">
          <div className="skeleton w-16 h-10" />
          <div className="flex-1 skeleton h-px" />
          <div className="skeleton w-16 h-10" />
        </div>
        <div className="skeleton w-20 h-8" />
      </div>
    </div>
  );
}

export function ResultsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <FlightCardSkeleton key={i} />
      ))}
    </div>
  );
}
