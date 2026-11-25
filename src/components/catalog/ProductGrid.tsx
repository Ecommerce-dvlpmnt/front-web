"use client"

import { useEffect, useRef } from "react"
import type { Product } from "@/types/product"
import type { ProductHeightVariant } from "@/features/product/height-variants"
import { pushViewItemList } from "@/lib/analytics/data-layer"
import { ProductCard, ProductCardSkeleton } from "./ProductCard"

interface ProductGridProps {
  products: Product[]
  heightVariantsByProductId?: Record<string, ProductHeightVariant[]>
  productOptionsByProductId?: Record<string, Product[]>
  searchQuery?: string
  itemListName: string
  eagerImages?: boolean
}

export function ProductGrid({ products, heightVariantsByProductId = {}, productOptionsByProductId = {}, searchQuery, itemListName, eagerImages = false }: ProductGridProps) {
  const reportedProductIds = useRef(new Set<string>())

  useEffect(() => {
    const newlyVisible = products.filter((product) => !reportedProductIds.current.has(product.id))
    if (newlyVisible.length === 0) return
    for (const product of newlyVisible) reportedProductIds.current.add(product.id)
    pushViewItemList(newlyVisible, itemListName)
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

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-6">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          heightVariants={heightVariantsByProductId[product.id] ?? []}
          productOptions={productOptionsByProductId[product.id] ?? []}
          priority={eagerImages && index < 4}
        />
      ))}
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
