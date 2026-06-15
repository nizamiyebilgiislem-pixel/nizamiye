export default function GorevlerLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2">
              <div className="size-8 animate-pulse rounded-md bg-muted" />
              <div className="space-y-1 flex-1">
                <div className="h-5 w-12 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="flex flex-wrap items-center gap-1 border-b">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-20 animate-pulse rounded-md bg-muted m-1" />
        ))}
      </div>

      {/* Task list skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="size-5 animate-pulse rounded bg-muted mt-0.5" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-64 animate-pulse rounded bg-muted" />
                  <div className="flex items-center gap-4">
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-8 animate-pulse rounded bg-muted" />
                <div className="size-8 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}