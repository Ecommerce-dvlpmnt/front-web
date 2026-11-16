"use client"

import { useEffect, useRef } from "react"

import { pushViewItem } from "@/lib/analytics/data-layer"
import type { Product } from "@/types/product"

export function ProductViewTracker({ product }: { product: Product }) {
  const reportedProductId = useRef<string | null>(null)

  useEffect(() => {
    if (reportedProductId.current === product.id) return
    reportedProductId.current = product.id
    pushViewItem(product)
  }, [product])

  return null
}
