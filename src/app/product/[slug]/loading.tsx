import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="py-8 sm:py-12" aria-label="Завантаження товару">
          <Skeleton className="h-4 w-56" />
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.92fr)] lg:gap-16">
            <div className="grid gap-4 md:grid-cols-[5.25rem_minmax(0,1fr)]">
              <div className="hidden md:block" />
              <Skeleton className="aspect-[2/3] w-full md:max-w-[26rem] rounded-3xl" />
            </div>
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
