import { ProductGridSkeleton } from "@/components/catalog/ProductGrid"
import { Skeleton } from "@/components/ui/skeleton"

export function CatalogSkeleton() {
  return (
    <section id="catalog" className="scroll-mt-24 py-16 sm:py-24" aria-label="Завантаження каталогу" aria-busy="true">
      <Skeleton className="h-4 w-28 rounded-full" />
      <Skeleton className="mt-3 h-9 w-64 rounded-xl" />
      <div className="mt-8 flex gap-2 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-8 w-32 shrink-0 rounded-full" />)}
      </div>
      <div className="mt-8"><ProductGridSkeleton /></div>
    </section>
  )
}
