"use client"

import { useEffect, useRef, useState } from "react"
import type { Product } from "@/types/product"
import { pushViewItemList } from "@/lib/analytics/data-layer"
import { Button } from "@/components/ui/button"
import { ProductCard, ProductCardSkeleton } from "./ProductCard"

const PAGE_BATCH_SIZE = 24

interface ProductGridProps {
  products: Product[]
  searchQuery?: string
  itemListName: string
}

export function ProductGrid({ products, searchQuery, itemListName }: ProductGridProps) {
  const lastReportedList = useRef("")
  const [visibleCount, setVisibleCount] = useState(PAGE_BATCH_SIZE)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setVisibleCount(PAGE_BATCH_SIZE)
  }, [itemListName, searchQuery, products.length])

  useEffect(() => {
    if (products.length === 0) return
    const reportKey = `${itemListName}:${products.map((product) => product.id).join(",")}`
    if (lastReportedList.current === reportKey) return
    lastReportedList.current = reportKey
    pushViewItemList(products.slice(0, PAGE_BATCH_SIZE), itemListName)
  }, [itemListName, products])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || visibleCount >= products.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_BATCH_SIZE, products.length))
        }
      },
      { rootMargin: "600px 0px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [visibleCount, products.length])

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-medium">
          {searchQuery
            ? `За запитом «${searchQuery}» товарів не знайдено.`
            : "Наразі товарів немає."}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Спробуйте змінити пошуковий запит або поверніться трохи пізніше.
        </p>
      </div>
    )
  }

  const visibleProducts = products.slice(0, visibleCount)
  const hasMore = visibleCount < products.length

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-6">
        {visibleProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 4}
          />
        ))}
      </div>

      {hasMore && (
        <div
          ref={sentinelRef}
          className="mt-10 flex flex-col items-center justify-center gap-3"
        >
          <p className="text-xs text-muted-foreground">
            Показано {visibleProducts.length} із {products.length} товарів
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setVisibleCount((prev) => Math.min(prev + PAGE_BATCH_SIZE, products.length))
            }
            className="rounded-full border-[#D4AF37]/45 px-7 py-2.5 text-xs font-semibold tracking-wider uppercase hover:bg-[#D4AF37]/10 cursor-pointer"
          >
            Показати ще ({Math.min(PAGE_BATCH_SIZE, products.length - visibleProducts.length)})
          </Button>
        </div>
      )}
    </div>
  )
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-6">
      {Array.from({ length: 8 }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}
