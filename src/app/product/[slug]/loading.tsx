import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="py-8 sm:py-12" aria-label="Завантаження товару">
          <Skeleton className="h-4 w-56" />
          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <Skeleton className="aspect-square w-full rounded-3xl" />
            <div>
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-5 h-12 w-4/5" />
              <Skeleton className="mt-4 h-4 w-24" />
              <Skeleton className="mt-9 h-10 w-48" />
              <Skeleton className="mt-8 h-10 w-full" />
              <Skeleton className="mt-3 h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
