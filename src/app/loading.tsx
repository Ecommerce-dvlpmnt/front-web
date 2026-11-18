import { ProductGridSkeleton } from "@/components/catalog/ProductGrid"
import { HeroBanner } from "@/components/home/HeroBanner"
import { Skeleton } from "@/components/ui/skeleton"
import { shopConfig } from "@/lib/config/shop"

export default function Loading() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <HeroBanner />

        <section className="py-16 sm:py-24" aria-label="Завантаження каталогу">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#A0772D] dark:text-[#D4AF37] uppercase">
                {shopConfig.seasonal.catalogEyebrow}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
                {shopConfig.seasonal.catalogTitle}
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {shopConfig.seasonal.description}
            </p>
          </div>

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
