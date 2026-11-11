import { ProductGridSkeleton } from "@/components/catalog/ProductGrid"
import { HeroBanner } from "@/components/home/HeroBanner"
import { shopConfig } from "@/lib/config/shop"

export default function Loading() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <HeroBanner />

        <section className="py-16 sm:py-24" aria-label="Завантаження каталогу">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              {shopConfig.seasonal.catalogEyebrow}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {shopConfig.seasonal.catalogTitle}
            </h2>
          </div>

          <div className="mt-8">
            <ProductGridSkeleton />
          </div>
        </section>
      </div>
    </div>
  )
}
