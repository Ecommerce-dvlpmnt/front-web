import { HeroBanner } from "@/components/home/HeroBanner"
import { shopConfig } from "@/lib/config/shop"

export default function Home() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <HeroBanner />

        <section id="catalog" className="scroll-mt-24 py-16 sm:py-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                {shopConfig.seasonal.catalogEyebrow}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                {shopConfig.seasonal.catalogTitle}
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Тут з’явиться сітка товарів, яку підключимо до каталогу та .NET API.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
