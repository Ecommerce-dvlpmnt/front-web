"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { ProductCard } from "@/components/catalog/ProductCard"
import type { ProductHeightVariant } from "@/features/product/height-variants"
import type { Product } from "@/types/product"

interface RecommendedProductsProps {
  products: Product[]
  heightVariantsByProductId: Record<string, ProductHeightVariant[]>
  productOptionsByProductId: Record<string, Product[]>
}

export function RecommendedProducts({ products, heightVariantsByProductId, productOptionsByProductId }: RecommendedProductsProps) {
  const track = useRef<HTMLDivElement>(null)
  if (products.length === 0) return null

  function move(direction: number) {
    const element = track.current
    if (!element) return
    const card = element.querySelector<HTMLElement>("[data-recommended-card]")
    element.scrollBy({ left: direction * ((card?.offsetWidth ?? element.clientWidth) + 16), behavior: "smooth" })
  }

  return (
    <section className="mt-14 border-t border-border/70 pt-10 sm:mt-20 sm:pt-14" aria-labelledby="recommended-title">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C5E14] dark:text-[#F3D078]">Добірка для вас</p>
          <h2 id="recommended-title" className="mt-2 font-heading text-2xl font-semibold text-foreground sm:text-3xl">Рекомендовані товари</h2>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" aria-label="Попередні рекомендовані товари" onClick={() => move(-1)} className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronLeft className="size-5" /></button>
          <button type="button" aria-label="Наступні рекомендовані товари" onClick={() => move(1)} className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronRight className="size-5" /></button>
        </div>
      </div>
      <div ref={track} className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Рекомендовані товари">
        {products.map((product) => (
          <div key={product.id} data-recommended-card className="w-[min(72vw,280px)] shrink-0 snap-start sm:w-[calc((100%_-_32px)/3)] lg:w-[calc((100%_-_48px)/4)]">
            <ProductCard product={product} heightVariants={heightVariantsByProductId[product.id] ?? []} productOptions={productOptionsByProductId[product.id] ?? []} />
          </div>
        ))}
      </div>
    </section>
  )
}
