export default function TalebelerLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-md bg-muted" />
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-10 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border bg-card">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b px-4 py-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${15 + i * 10}%` }} />
          ))}
        </div>
        {/* Table rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
          <div key={row} className="flex items-center gap-4 border-b px-4 py-4 last:border-b-0">
            <div className="size-8 animate-pulse rounded-full bg-muted" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </div>
            {[1, 2, 3, 4].map((col) => (
              <div key={col} className="h-4 w-20 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}