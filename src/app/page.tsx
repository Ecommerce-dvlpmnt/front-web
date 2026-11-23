import { Suspense } from "react"
import { Box, Factory, ShieldCheck, Truck } from "lucide-react"
import { HeroBanner } from "@/components/home/HeroBanner"
import { CatalogSkeleton } from "@/features/catalog/CatalogSkeleton"
import { StorefrontCatalog } from "@/features/catalog/StorefrontCatalog"
import { CatalogFilters } from "@/features/catalog/CatalogFilters"
import { getCatalogFilters, getCatalogPageNumber, getCatalogQuery, type CatalogSearchParams } from "@/features/catalog/navigation"

interface HomeProps {
  searchParams: Promise<CatalogSearchParams>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams
  const query = getCatalogQuery(params.query)
  const pageNumber = getCatalogPageNumber(params.page)
  const filters = getCatalogFilters(params)

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <HeroBanner />

        {/* Чому обирають Jingle Decor — затишний преміальний блок переваг із золотими медальйонами */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/45 hover:shadow-luxury">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#8C5E14] dark:text-[#F3D078] transition-transform duration-300 group-hover:scale-105">
                <Factory className="size-4.5" strokeWidth={1.75} />
              </div>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-[#8C5E14]/70 dark:text-[#F3D078]/60">
                Авторський декор
              </span>
            </div>
            <h3 className="mt-4 font-heading text-sm font-bold tracking-wide text-foreground">
              Ручна робота та затишок
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Створюємо пухнасті ялинки, різдвяні вінки та святкові прикраси з увагою до кожної гілочки й деталі.
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/45 hover:shadow-luxury">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#8C5E14] dark:text-[#F3D078] transition-transform duration-300 group-hover:scale-105">
                <ShieldCheck className="size-4.5" strokeWidth={1.75} />
              </div>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-[#8C5E14]/70 dark:text-[#F3D078]/60">
                Еко-безпека
              </span>
            </div>
            <h3 className="mt-4 font-heading text-sm font-bold tracking-wide text-foreground">
              Як справжня лісова хвоя
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              М’які та густі литі гілочки, які приємно прикрашати всією родиною. Безпечні для дітей та домашніх улюбленців.
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/45 hover:shadow-luxury">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#8C5E14] dark:text-[#F3D078] transition-transform duration-300 group-hover:scale-105">
                <Box className="size-4.5" strokeWidth={1.75} />
              </div>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-[#8C5E14]/70 dark:text-[#F3D078]/60">
                Турбота про свято
              </span>
            </div>
            <h3 className="mt-4 font-heading text-sm font-bold tracking-wide text-foreground">
              Дбайливе пакування
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Кожна ялинка та прикраса приїжджають у міцній фірмовій коробці, в якій декор зручно зберігати до наступної зими.
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/45 hover:shadow-luxury">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#8C5E14] dark:text-[#F3D078] transition-transform duration-300 group-hover:scale-105">
                <Truck className="size-4.5" strokeWidth={1.75} />
              </div>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-[#8C5E14]/70 dark:text-[#F3D078]/60">
                1–2 дні по Україні
              </span>
            </div>
            <h3 className="mt-4 font-heading text-sm font-bold tracking-wide text-foreground">
              Оплата після огляду
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Швидка відправка Новою Поштою. Спокійно оглядайте красу та якість декору у відділенні перед оплатою.
            </p>
          </div>
        </div>

        <div id="catalog" className="scroll-mt-24 pt-12 sm:pt-16">
          <CatalogFilters searchQuery={query} filters={filters} />
          <div className="min-h-[520px] transition-opacity duration-300">
            <Suspense key={`${query}:${pageNumber}:${JSON.stringify(filters)}`} fallback={<CatalogSkeleton />}>
              <StorefrontCatalog searchQuery={query} pageNumber={pageNumber} filters={filters} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
