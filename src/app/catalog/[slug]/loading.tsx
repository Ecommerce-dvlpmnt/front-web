import { ProductGridSkeleton } from "@/components/catalog/ProductGrid"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <section className="py-16 sm:py-24" aria-label="Завантаження категорії">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-10 w-64" />
          <div className="mt-8">
            <ProductGridSkeleton />
          </div>
        </section>
      </div>
    </div>
  )
}
