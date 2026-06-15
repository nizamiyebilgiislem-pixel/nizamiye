export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 animate-pulse rounded-lg bg-muted" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Large card skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-64 animate-pulse rounded-lg border bg-card" />
        </div>
        {/* Sidebar skeleton */}
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-lg border bg-card" />
          <div className="h-32 animate-pulse rounded-lg border bg-card" />
        </div>
      </div>
    </div>
  );
}