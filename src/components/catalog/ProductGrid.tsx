"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import type { Product } from "@/types/product"
import { pushViewItemList } from "@/lib/analytics/data-layer"
import { ProductCard, ProductCardSkeleton } from "./ProductCard"

interface ProductGridProps {
  products: Product[]
  searchQuery?: string
  itemListName: string
  eagerImages?: boolean
}

export function ProductGrid({ products, searchQuery, itemListName, eagerImages = false }: ProductGridProps) {
  const [visibleCount, setVisibleCount] = useState(24)
  const visibleProducts = useMemo(() => products.slice(0, visibleCount), [products, visibleCount])
  const reportedProductIds = useRef(new Set<string>())

  useEffect(() => {
    const newlyVisible = visibleProducts.filter((product) => !reportedProductIds.current.has(product.id))
    if (newlyVisible.length === 0) return
    for (const product of newlyVisible) reportedProductIds.current.add(product.id)
    pushViewItemList(newlyVisible, itemListName)
  }, [itemListName, visibleProducts])

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

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-6">
        {visibleProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={eagerImages && index < 4}
          />
        ))}
      </div>
      {visibleCount < products.length && (
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => setVisibleCount((count) => count + 24)}>
            Показати ще товари ({products.length - visibleCount})
          </Button>
        </div>
      )}
    </>
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
