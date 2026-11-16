export default function AnalyticsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-10 w-72 animate-pulse rounded bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl border border-border bg-card" />)}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-border bg-card" />
    </div>
  )
}
