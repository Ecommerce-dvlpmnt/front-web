"use client"

import { useEffect, useRef, useState } from "react"
import type { Product } from "@/types/product"
import { pushViewItemList } from "@/lib/analytics/data-layer"
import { Button } from "@/components/ui/button"
import { ProductCard, ProductCardSkeleton } from "./ProductCard"

const PAGE_BATCH_SIZE = 16

interface ProductGridProps {
  products: Product[]
  searchQuery?: string
  itemListName: string
}

export function ProductGrid({ products, searchQuery, itemListName }: ProductGridProps) {
  const lastReportedList = useRef("")
  const listKey = `${itemListName}:${searchQuery ?? ""}:${products.length}`
  const [paginationState, setPaginationState] = useState({
    key: listKey,
    count: PAGE_BATCH_SIZE,
  })
  const visibleCount =
    paginationState.key === listKey ? paginationState.count : PAGE_BATCH_SIZE

  useEffect(() => {
    if (products.length === 0) return
    const reportKey = `${itemListName}:${products.map((product) => product.id).join(",")}`
    if (lastReportedList.current === reportKey) return
    lastReportedList.current = reportKey
    pushViewItemList(products.slice(0, PAGE_BATCH_SIZE), itemListName)
  }, [itemListName, products])

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
  const remainingCount = products.length - visibleProducts.length
  const hasMore = remainingCount > 0
  const progressPercent = Math.min(100, Math.round((visibleProducts.length / products.length) * 100))

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
        <div className="mt-10 flex flex-col items-center justify-center gap-3.5">
          <div className="flex flex-col items-center gap-2 w-full max-w-xs">
            <p className="text-xs font-medium text-muted-foreground">
              Показано <span className="font-semibold text-foreground">{visibleProducts.length}</span> із{" "}
              <span className="font-semibold text-foreground">{products.length}</span> товарів
            </p>
            <div className="h-1 w-44 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[#D4AF37] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setPaginationState({
                key: listKey,
                count: Math.min(visibleCount + PAGE_BATCH_SIZE, products.length),
              })
            }
            className="rounded-full border-[#D4AF37]/50 bg-card px-8 py-5 text-xs font-semibold tracking-wider uppercase text-foreground shadow-xs transition-all duration-300 hover:border-[#D4AF37] hover:bg-[#D4AF37]/12 active:scale-[0.98] cursor-pointer"
          >
            Показати ще {Math.min(PAGE_BATCH_SIZE, remainingCount)} товарів
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
