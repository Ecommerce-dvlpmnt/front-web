
import { Box, Factory, ShieldCheck, Truck } from "lucide-react"

import { HeroBanner } from "@/components/home/HeroBanner"
import { CatalogSection } from "@/components/catalog/CatalogSection"
import {
  buildCategoryTree,
  getCategories,
} from "@/lib/api/categories"
import { getProducts } from "@/lib/api/products"
import { shopConfig } from "@/lib/config/shop"

interface HomeProps {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined
  }>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams
  const rawQuery = params.query
  const query = (
    Array.isArray(rawQuery) ? rawQuery[0] : rawQuery
  )?.trim() ?? ""
  const [products, categories] = await Promise.all([
    getProducts({ search: query }),
    getCategories({ onlyActive: true })
      .then(buildCategoryTree)
      .catch(() => []),
  ])

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
                Власна фабрика
              </span>
            </div>
            <h3 className="mt-4 text-sm font-bold tracking-wide text-foreground">
              Прямо з виробництва
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Чесна ціна без націнок посередників. Усі замовлення дбайливо пакуються та відправляються напряму з фабрики.
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
            <h3 className="mt-4 text-sm font-bold tracking-wide text-foreground">
              100% Лита хвоя
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Первинний харчовий полімер. Безпечно для дітей та улюбленців, не обсипається і не має стороннього запаху.
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/45 hover:shadow-luxury">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#8C5E14] dark:text-[#F3D078] transition-transform duration-300 group-hover:scale-105">
                <Box className="size-4.5" strokeWidth={1.75} />
              </div>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-[#8C5E14]/70 dark:text-[#F3D078]/60">
                Надійне пакування
              </span>
            </div>
            <h3 className="mt-4 text-sm font-bold tracking-wide text-foreground">
              Заводська коробка
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Цупкий 5-шаровий гофрокартон захищає декор у дорозі та зручно служить для дбайливого зберігання щороку.
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
            <h3 className="mt-4 text-sm font-bold tracking-wide text-foreground">
              Оплата при отриманні
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Швидка доставка Новою Поштою. Спокійно оглядайте пишність та якість хвої у відділенні перед оплатою.
            </p>
          </div>
        </div>

        <CatalogSection
          eyebrow={shopConfig.seasonal.catalogEyebrow}
          title={shopConfig.seasonal.catalogTitle}
          description={
            query
              ? `Результати пошуку для «${query}».`
              : "Обирайте подарунки та декор для особливих моментів."
          }
          products={products}
          categories={categories}
          searchQuery={query}
        />
      </div>
    </div>
  )
}
