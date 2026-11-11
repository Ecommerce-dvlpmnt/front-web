
import type { Product } from "@/types/product"
import { ProductCard, ProductCardSkeleton } from "./ProductCard"

interface ProductGridProps {
  products: Product[]
  searchQuery?: string
}

export function ProductGrid({ products, searchQuery }: ProductGridProps) {
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
