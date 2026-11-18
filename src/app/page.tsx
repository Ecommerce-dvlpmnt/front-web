
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

        {/* Чому обирають ялинки Jingle Decor — витриманий дизайнерський блок замість шаблонних плашок */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          <div className="group rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-luxury">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-muted-foreground/80">01</span>
              <Factory className="size-4 text-[#C8923A] dark:text-[#D4AF37]" strokeWidth={1.75} />
            </div>
            <h3 className="mt-3 text-sm font-bold uppercase tracking-wider text-foreground">
              Прямо з виробництва
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Чесна ціна без націнок посередників. Усі замовлення пакуються та відправляються напряму з фабрики.
            </p>
          </div>

          <div className="group rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-luxury">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-muted-foreground/80">02</span>
              <ShieldCheck className="size-4 text-[#C8923A] dark:text-[#D4AF37]" strokeWidth={1.75} />
            </div>
            <h3 className="mt-3 text-sm font-bold uppercase tracking-wider text-foreground">
              100% Лита хвоя
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Первинний харчовий полімер. Безпечно для дітей та улюбленців, не обсипається і не має запаху.
            </p>
          </div>

          <div className="group rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-luxury">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-muted-foreground/80">03</span>
              <Box className="size-4 text-[#C8923A] dark:text-[#D4AF37]" strokeWidth={1.75} />
            </div>
            <h3 className="mt-3 text-sm font-bold uppercase tracking-wider text-foreground">
              Заводська коробка
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Цупкий 5-шаровий гофрокартон захищає виріб у пошті та зручно служить для зберігання щороку.
            </p>
          </div>

          <div className="group rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-luxury">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-muted-foreground/80">04</span>
              <Truck className="size-4 text-[#C8923A] dark:text-[#D4AF37]" strokeWidth={1.75} />
            </div>
            <h3 className="mt-3 text-sm font-bold uppercase tracking-wider text-foreground">
              Оплата при отриманні
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Швидка доставка Новою Поштою 1–2 дні. Оглядайте якість хвої у відділенні перед оплатою.
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
