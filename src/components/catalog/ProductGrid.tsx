"use client"

import { useEffect, useRef } from "react"
import type { Product } from "@/types/product"
import { pushViewItemList } from "@/lib/analytics/data-layer"
import { ProductCard, ProductCardSkeleton } from "./ProductCard"

interface ProductGridProps {
  products: Product[]
  searchQuery?: string
  itemListName: string
}

export function ProductGrid({ products, searchQuery, itemListName }: ProductGridProps) {
  const lastReportedList = useRef("")

  useEffect(() => {
    if (products.length === 0) return
    const reportKey = `${itemListName}:${products.map((product) => product.id).join(",")}`
    if (lastReportedList.current === reportKey) return
    lastReportedList.current = reportKey
    pushViewItemList(products, itemListName)
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
          priority={index === 0}
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
