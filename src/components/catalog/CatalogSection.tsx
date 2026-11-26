import Link from "next/link"
import { JsonLd } from "@/components/seo/JsonLd"

import { MobileCategoryNav } from "@/components/catalog/MobileCategoryNav"
import { ProductGrid } from "@/components/catalog/ProductGrid"
import { CatalogPagination } from "@/features/catalog/CatalogPagination"
import { CatalogReset } from "@/features/catalog/CatalogReset"
import { findCatalogCategory, getCatalogCategoryIds, getCatalogHref, type CatalogFilters as Filters } from "@/features/catalog/navigation"
import type { ProductHeightVariant } from "@/features/product/height-variants"
import { formatCategoryName } from "@/lib/formatters/category"
import { cn } from "@/lib/utils"
import type { CategoryTreeNode } from "@/types/category"
import type { Product, ProductPage } from "@/types/product"

interface CatalogSectionProps {
  structuredData?: unknown
  title: string
  eyebrow: string
  description: string
  productPage: ProductPage
  heightVariantsByProductId?: Record<string, ProductHeightVariant[]>
  productOptionsByProductId?: Record<string, Product[]>
  categories?: CategoryTreeNode[]
  activeCategorySlug?: string
  searchQuery?: string
  filters?: Filters
}

export function CatalogSection({ title, eyebrow, description, productPage, heightVariantsByProductId = {}, productOptionsByProductId = {}, categories = [], activeCategorySlug, searchQuery, filters = {}, structuredData }: CatalogSectionProps) {
  const currentCategory = activeCategorySlug ? findCatalogCategory(categories, activeCategorySlug) : undefined
  const parent = currentCategory?.parentId ? categories.flatMap(function flatten(category): CategoryTreeNode[] {
    return [category, ...category.children.flatMap(flatten)]
  }).find((category) => category.id === currentCategory.parentId) : undefined
  const subcategories = currentCategory?.children.length ? currentCategory.children : parent?.children ?? []
  const currentTitle = currentCategory ? formatCategoryName(currentCategory.name) : title
  const href = (slug?: string) => getCatalogHref({ categorySlug: slug, searchQuery, filters })

  return (
    <section className="py-8 sm:py-10">
      {structuredData ? <JsonLd data={structuredData} /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">{eyebrow}</p>
          {activeCategorySlug
            ? <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{currentTitle}</h1>
            : <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{currentTitle}</h2>}
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>

      <MobileCategoryNav categories={categories} activeCategorySlug={activeCategorySlug} searchQuery={searchQuery} filters={filters} />

      <nav className="mt-8 hidden gap-2 pb-2 md:flex md:flex-wrap md:gap-2.5" aria-label="Основні розділи каталогу">
        <Link
          href={href()}
          prefetch={false}
          className={cn("shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-ring", !activeCategorySlug ? "border-transparent bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground")}
          aria-current={!activeCategorySlug ? "page" : undefined}
        >
          Усі товари
        </Link>
        {categories.map((category) => {
          const active = currentCategory && getCatalogCategoryIds(category).includes(currentCategory.id)
          return (
            <Link
              key={category.id}
              href={href(category.slug)}
              prefetch={false}
              className={cn("shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "border-transparent bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground")}
              aria-current={active ? "page" : undefined}
            >
              {category.name}
            </Link>
          )
        })}
      </nav>

      {subcategories.length > 0 && (
        <nav className="mt-3 hidden gap-2 pb-1 md:flex md:flex-wrap md:gap-2.5" aria-label="Підкатегорії">
          {subcategories.map((category) => (
            <Link
              key={category.id}
              href={href(category.slug)}
              prefetch={false}
              className={cn("shrink-0 rounded-lg px-3 py-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring", category.slug === activeCategorySlug ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
              aria-current={category.slug === activeCategorySlug ? "page" : undefined}
            >
              {formatCategoryName(category.name)}
            </Link>
          ))}
        </nav>
      )}

      <div
        className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4 text-xs"
        role="status"
      >
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="inline-block size-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.6)]" aria-hidden="true" />
          <span className="font-medium tracking-wide text-foreground">
            {productPage.totalSkuCount !== undefined
              ? `Моделей: ${productPage.totalCount} · Варіантів товарів: ${productPage.totalSkuCount}`
              : `Товарів: ${productPage.totalCount}`}
          </span>
          {(searchQuery || filters.sortBy || filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.inStock) && (
            <CatalogReset categorySlug={activeCategorySlug} />
          )}
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3.5 py-1 text-muted-foreground backdrop-blur-xs shadow-2xs">
          <span className="size-1.5 rounded-full bg-muted-foreground/50" aria-hidden="true" />
          <span className="font-medium tracking-wide">
            Сторінка {productPage.pageNumber} із {Math.max(1, productPage.totalPages)}
          </span>
        </div>
      </div>
      <div className="mt-8 min-h-[520px] transition-opacity duration-300">
        <ProductGrid
          key={`${activeCategorySlug ?? "all"}:${searchQuery ?? ""}:${productPage.pageNumber}`}
          products={productPage.items}
          heightVariantsByProductId={heightVariantsByProductId}
          productOptionsByProductId={productOptionsByProductId}
          searchQuery={searchQuery}
          itemListName={currentTitle}
          eagerImages={Boolean(activeCategorySlug)}
          prominent={!activeCategorySlug}
        />
      </div>
      <CatalogPagination pageNumber={productPage.pageNumber} totalPages={productPage.totalPages} categorySlug={activeCategorySlug} searchQuery={searchQuery} filters={filters} />
    </section>
  )
}
