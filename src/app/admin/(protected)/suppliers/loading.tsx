import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-10 w-64" />
        <Skeleton className="mt-8 h-24 w-full rounded-xl" />
        <Skeleton className="mt-6 h-14 w-full rounded-xl" />
        <Skeleton className="mt-4 h-80 w-full rounded-xl" />
      </div>
    </div>
  )
}
