export default function AdminOrdersLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-9 w-56 animate-pulse rounded bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl border border-border bg-card" />)}
      </div>
      <div className="h-14 animate-pulse rounded-xl bg-muted" />
      <div className="h-96 animate-pulse rounded-xl border border-border bg-card" />
    </div>
  )
}
