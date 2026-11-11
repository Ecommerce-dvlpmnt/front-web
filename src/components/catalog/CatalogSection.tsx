import Link from "next/link"

import { ProductGrid } from "@/components/catalog/ProductGrid"
import type { CategoryTreeNode } from "@/types/category"
import type { Product } from "@/types/product"
import { cn } from "@/lib/utils"

interface CatalogSectionProps {
  title: string
  eyebrow: string
  description: string
  products: Product[]
  categories?: CategoryTreeNode[]
  activeCategorySlug?: string
  searchQuery?: string
}

export function CatalogSection({
  title,
  eyebrow,
  description,
  products,
  categories = [],
  activeCategorySlug,
  searchQuery,
}: CatalogSectionProps) {
  return (
    <section id="catalog" className="scroll-mt-24 py-16 sm:py-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {eyebrow}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
        </div>

        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      {categories.length > 0 && (
        <nav
          className="mt-7 flex gap-2 overflow-x-auto pb-1"
          aria-label="Фільтр за категоріями"
        >
          <Link
            href="/#catalog"
            className={cn(
              "shrink-0 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-muted",
              !activeCategorySlug && "bg-foreground text-background hover:bg-foreground/90"
            )}
            aria-current={!activeCategorySlug ? "page" : undefined}
          >
            Усі товари
          </Link>

          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalog/${category.slug}`}
              className={cn(
                "shrink-0 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-muted",
                activeCategorySlug === category.slug &&
                  "bg-foreground text-background hover:bg-foreground/90"
              )}
              aria-current={
                activeCategorySlug === category.slug ? "page" : undefined
              }
            >
              {category.name}
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-8">
        <ProductGrid products={products} searchQuery={searchQuery} />
      </div>
    </section>
  )
}
