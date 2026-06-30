export function PanelShellSkeleton() {
  return (
    <div className="min-h-screen bg-[#f6f8fa] text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-white md:flex md:flex-col">
          <div className="flex h-14 items-center gap-2 border-b border-border px-4">
            <div className="size-7 animate-pulse rounded bg-muted" />
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex-1 space-y-1 p-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-2 rounded-md px-3 py-2">
                <div className="size-4 animate-pulse rounded bg-muted" />
                <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-3">
              <div className="size-8 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4">
            <div className="flex items-center gap-3">
              <div className="size-6 animate-pulse rounded bg-muted md:hidden" />
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            </div>
            <div className="flex items-center gap-2">
              <div className="size-8 animate-pulse rounded bg-muted" />
              <div className="size-8 animate-pulse rounded bg-muted" />
            </div>
          </header>
          <main className="flex-1 p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="h-8 w-48 animate-pulse rounded bg-muted" />
                <div className="h-4 w-72 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-96 animate-pulse rounded-lg bg-muted" />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
