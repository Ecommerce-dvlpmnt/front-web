import { ProductGridSkeleton } from "@/components/catalog/ProductGrid"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <section className="py-16 sm:py-24" aria-label="Завантаження категорії">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="mt-3 h-9 w-64 rounded-xl" />
            </div>
            <Skeleton className="h-4 w-72 max-w-sm rounded-lg" />
          </div>

          {/* Скелетоны табов категорий без скачка высоты */}
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none" aria-hidden="true">
            <Skeleton className="h-8 w-28 shrink-0 rounded-full" />
            <Skeleton className="h-8 w-36 shrink-0 rounded-full" />
            <Skeleton className="h-8 w-32 shrink-0 rounded-full" />
            <Skeleton className="h-8 w-40 shrink-0 rounded-full" />
            <Skeleton className="h-8 w-36 shrink-0 rounded-full" />
          </div>

          <div className="mt-8">
            <ProductGridSkeleton />
          </div>
        </section>
      </div>
    </div>
  )
}
