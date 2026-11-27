import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { getCategories } from "@/lib/api/categories"
import { getSeoData } from "@/lib/api/seo"
import { catalogMetadata } from "@/lib/seo/metadata"
import { homeGraph, shopFaq } from "@/lib/seo/home"
import { JsonLd } from "@/components/seo/JsonLd"
import { shopConfig } from "@/lib/config/shop"
import { Box, Clock3, Factory, ShieldCheck, Sparkles, Truck } from "lucide-react"
import { FaqAccordion } from "@/components/home/FaqAccordion"
import { HeroBanner } from "@/components/home/HeroBanner"
import { HeroSection } from "@/components/home/HeroSection"
import { CatalogSkeleton } from "@/features/catalog/CatalogSkeleton"
import { StorefrontCatalog } from "@/features/catalog/StorefrontCatalog"
import { CatalogFilters } from "@/features/catalog/CatalogFilters"
import { getCatalogFilters, getCatalogHref, getCatalogPageNumber, getCatalogQuery, type CatalogSearchParams } from "@/features/catalog/navigation"

interface HomeProps {
  searchParams: Promise<CatalogSearchParams>
}

export async function generateMetadata({ searchParams }: HomeProps) {
  const [params, seo] = await Promise.all([searchParams, getSeoData("home")])
  return catalogMetadata("/", seo.metaTitle || "Jingle Decor — ялинки, гірлянди та святковий декор",
    seo.metaDescription || "Штучні ялинки, різдвяні вінки, світлові та хвойні гірлянди. Ціни у гривнях, доставка по Україні.", params)
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams
  const query = getCatalogQuery(params.query ?? params.search)
  const pageNumber = getCatalogPageNumber(params.page)
  const filters = getCatalogFilters(params)
  if (params.category) {
    const value = getCatalogQuery(params.category)
    const category = (await getCategories({ onlyActive: true })).find((item) => item.slug === value || item.id === value)
    if (!category) notFound()
    redirect(getCatalogHref({ categorySlug: category.slug, searchQuery: query, filters, pageNumber }))
  }
  const seo = await getSeoData("home")

  return (
    <div className="relative overflow-x-clip bg-background">
      {/* Атмосферні фонові свічення для глибини сторінки */}
      <div
        className="pointer-events-none absolute top-[28rem] left-1/2 -z-0 h-[32rem] w-[68rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08),transparent_68%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(24,62,46,0.45),transparent_68%)] blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-24 right-0 -z-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.07),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(212,175,55,0.08),transparent_70%)] blur-2xl"
        aria-hidden="true"
      />

      <h1 className="sr-only">{shopConfig.seasonal.title} — Jingle Decor</h1>
      <JsonLd data={homeGraph(seo.jsonLd)} />
      <div className="relative z-10 mx-auto max-w-7xl px-3.5 py-4 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        <Suspense fallback={<HeroBanner />}>
          <HeroSection />
        </Suspense>

        {/* Чому обирають Jingle Decor — показуємо на планшетах та ПК (на мобільних приховано, щоб одразу показувати товари) */}
        <section className="mt-6 sm:mt-9 hidden md:block" aria-labelledby="shop-benefits">
          <h2 id="shop-benefits" className="sr-only">Чому обирають Jingle Decor</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            <div className="group relative overflow-hidden rounded-2xl border border-[#D4AF37]/25 dark:border-[#D4AF37]/20 bg-gradient-to-br from-card via-card to-[#F5EFE4]/80 dark:from-[#131F1A] dark:via-[#111B17] dark:to-[#182921]/90 p-3.5 sm:p-5 lg:p-6 shadow-luxury transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/55 hover:shadow-luxury-hover">
              <div className="pointer-events-none absolute -top-8 -right-8 size-24 rounded-full bg-[#D4AF37]/12 dark:bg-[#D4AF37]/10 blur-xl" aria-hidden="true" />
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/12 text-[#8C5E14] dark:text-[#F3D078] transition-transform duration-300 group-hover:scale-105">
                  <Factory className="size-4 sm:size-4.5" strokeWidth={1.75} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider sm:tracking-widest uppercase text-[#8C5E14]/80 dark:text-[#F3D078]/70">
                  Авторський декор
                </span>
              </div>
              <h3 className="mt-2.5 sm:mt-4 font-heading text-[13px] sm:text-sm font-bold leading-snug tracking-wide text-foreground">
                Ручна робота та затишок
              </h3>
              <p className="mt-1 sm:mt-1.5 text-[11.5px] sm:text-xs text-muted-foreground leading-relaxed">
                Створюємо пухнасті ялинки, різдвяні вінки та святкові прикраси з увагою до кожної гілочки й деталі.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-[#D4AF37]/25 dark:border-[#D4AF37]/20 bg-gradient-to-br from-card via-card to-[#F5EFE4]/80 dark:from-[#131F1A] dark:via-[#111B17] dark:to-[#182921]/90 p-3.5 sm:p-5 lg:p-6 shadow-luxury transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/55 hover:shadow-luxury-hover">
              <div className="pointer-events-none absolute -top-8 -right-8 size-24 rounded-full bg-[#D4AF37]/12 dark:bg-[#D4AF37]/10 blur-xl" aria-hidden="true" />
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/12 text-[#8C5E14] dark:text-[#F3D078] transition-transform duration-300 group-hover:scale-105">
                  <ShieldCheck className="size-4 sm:size-4.5" strokeWidth={1.75} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider sm:tracking-widest uppercase text-[#8C5E14]/80 dark:text-[#F3D078]/70">
                  Еко-безпека
                </span>
              </div>
              <h3 className="mt-2.5 sm:mt-4 font-heading text-[13px] sm:text-sm font-bold leading-snug tracking-wide text-foreground">
                Як справжня лісова хвоя
              </h3>
              <p className="mt-1 sm:mt-1.5 text-[11.5px] sm:text-xs text-muted-foreground leading-relaxed">
                М’які та густі литі гілочки, які приємно прикрашати всією родиною. Безпечні для дітей та домашніх улюбленців.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-[#D4AF37]/25 dark:border-[#D4AF37]/20 bg-gradient-to-br from-card via-card to-[#F5EFE4]/80 dark:from-[#131F1A] dark:via-[#111B17] dark:to-[#182921]/90 p-3.5 sm:p-5 lg:p-6 shadow-luxury transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/55 hover:shadow-luxury-hover">
              <div className="pointer-events-none absolute -top-8 -right-8 size-24 rounded-full bg-[#D4AF37]/12 dark:bg-[#D4AF37]/10 blur-xl" aria-hidden="true" />
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/12 text-[#8C5E14] dark:text-[#F3D078] transition-transform duration-300 group-hover:scale-105">
                  <Box className="size-4 sm:size-4.5" strokeWidth={1.75} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider sm:tracking-widest uppercase text-[#8C5E14]/80 dark:text-[#F3D078]/70">
                  Турбота про свято
                </span>
              </div>
              <h3 className="mt-2.5 sm:mt-4 font-heading text-[13px] sm:text-sm font-bold leading-snug tracking-wide text-foreground">
                Дбайливе пакування
              </h3>
              <p className="mt-1 sm:mt-1.5 text-[11.5px] sm:text-xs text-muted-foreground leading-relaxed">
                Кожна ялинка та прикраса приїжджають у міцній фірмовій коробці, в якій декор зручно зберігати до наступної зими.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-[#D4AF37]/25 dark:border-[#D4AF37]/20 bg-gradient-to-br from-card via-card to-[#F5EFE4]/80 dark:from-[#131F1A] dark:via-[#111B17] dark:to-[#182921]/90 p-3.5 sm:p-5 lg:p-6 shadow-luxury transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/55 hover:shadow-luxury-hover">
              <div className="pointer-events-none absolute -top-8 -right-8 size-24 rounded-full bg-[#D4AF37]/12 dark:bg-[#D4AF37]/10 blur-xl" aria-hidden="true" />
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/12 text-[#8C5E14] dark:text-[#F3D078] transition-transform duration-300 group-hover:scale-105">
                  <Truck className="size-4 sm:size-4.5" strokeWidth={1.75} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider sm:tracking-widest uppercase text-[#8C5E14]/80 dark:text-[#F3D078]/70">
                  1–2 дні по Україні
                </span>
              </div>
              <h3 className="mt-2.5 sm:mt-4 font-heading text-[13px] sm:text-sm font-bold leading-snug tracking-wide text-foreground">
                Оплата після огляду
              </h3>
              <p className="mt-1 sm:mt-1.5 text-[11.5px] sm:text-xs text-muted-foreground leading-relaxed">
                Швидка відправка Новою Поштою. Спокійно оглядайте красу та якість декору у відділенні перед оплатою.
              </p>
            </div>
          </div>
        </section>

        {/* Ювелірний святковий розділювач */}
        <div className="mt-8 sm:mt-11 hidden md:flex items-center justify-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 max-w-44 bg-gradient-to-r from-transparent via-[#D4AF37]/45 to-[#D4AF37]/15" />
          <span className="text-xs text-[#8C5E14]/70 dark:text-[#F3D078]/75">✦</span>
          <span className="size-1.5 rotate-45 bg-[#D4AF37]/70" />
          <span className="text-xs text-[#8C5E14]/70 dark:text-[#F3D078]/75">✦</span>
          <span className="h-px flex-1 max-w-44 bg-gradient-to-l from-transparent via-[#D4AF37]/45 to-[#D4AF37]/15" />
        </div>

        <div id="catalog" className="scroll-mt-24 pt-6 sm:pt-9">
          <CatalogFilters searchQuery={query} filters={filters} />
          <div className="min-h-[520px] transition-opacity duration-300">
            <Suspense key={`${query}:${pageNumber}:${JSON.stringify(filters)}`} fallback={<CatalogSkeleton />}>
              <StorefrontCatalog searchQuery={query} pageNumber={pageNumber} filters={filters} />
            </Suspense>
          </div>
        </div>

        {/* Ювелірний розділювач перед блоком FAQ */}
        <div className="mt-6 sm:mt-10 flex items-center justify-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 max-w-44 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
          <span className="text-xs text-[#8C5E14]/65 dark:text-[#F3D078]/70">✦</span>
          <span className="h-px flex-1 max-w-44 bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-transparent" />
        </div>

        <section className="py-8 sm:py-12" aria-labelledby="faq-title">
          <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-10 items-start">
            <div className="rounded-3xl border border-[#D4AF37]/30 dark:border-[#D4AF37]/25 bg-gradient-to-br from-[#F7F1E5] via-[#F2E9D8] to-[#EADCC5] dark:from-[#0F1E18] dark:via-[#0D1813] dark:to-[#14251D] p-6 sm:p-8 shadow-luxury">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#8C5E14]/25 dark:border-[#F3D078]/30 bg-[#D4AF37]/15 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7A4F08] dark:text-[#F3D078]">
                <Sparkles className="size-3.5" aria-hidden="true" />
                <span>Довідка покупця</span>
              </div>
              <h2 id="faq-title" className="mt-4 font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Поширені запитання
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Зібрали відповіді про матеріали хвої, пакування, доставку по Україні та зручну оплату після огляду.
              </p>
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#8C5E14]/15 dark:border-[#F3D078]/15 bg-background/65 dark:bg-[#0B1310]/65 p-4 text-xs text-muted-foreground backdrop-blur-xs">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-[#8C5E14] dark:text-[#F3D078]" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-foreground">Графік підтримки магазину</p>
                  <p className="mt-1 leading-relaxed">{shopConfig.contact.hours}</p>
                </div>
              </div>
            </div>

            <FaqAccordion items={shopFaq} />
          </div>
        </section>
      </div>
    </div>
  )
}
