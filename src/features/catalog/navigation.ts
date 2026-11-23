import type { CategoryTreeNode } from "@/types/category"

export type CatalogSearchParams = Record<string, string | string[] | undefined>
export interface CatalogFilters {
  sortBy?: "date_desc" | "price_asc" | "price_desc"
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
}

export function getCatalogFilters(params: CatalogSearchParams): CatalogFilters {
  const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value
  const sort = one(params.sort)
  const price = (value: string | string[] | undefined) => {
    const raw = one(value)
    if (!raw || !/^\d+(?:\.\d{1,2})?$/.test(raw)) return undefined
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed <= 10000000 ? parsed : undefined
  }
  const minPrice = price(params.minPrice)
  const maxPrice = price(params.maxPrice)
  return {
    sortBy: sort === "price_asc" || sort === "price_desc" ? sort : undefined,
    minPrice,
    maxPrice: maxPrice !== undefined && minPrice !== undefined && maxPrice < minPrice ? undefined : maxPrice,
    inStock: one(params.inStock) === "1",
  }
}

export function getCatalogQuery(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? ""
}

export function getCatalogPageNumber(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw || !/^\d+$/.test(raw)) return 1
  const page = Number(raw)
  return Number.isSafeInteger(page) && page > 0 && page <= 2147483647 ? page : 1
}

export function getCatalogHref({
  categorySlug,
  searchQuery,
  filters = {},
  pageNumber = 1,
}: { categorySlug?: string; searchQuery?: string; filters?: CatalogFilters; pageNumber?: number } = {}): string {
  const path = categorySlug ? `/catalog/${encodeURIComponent(categorySlug)}` : "/"
  const params = new URLSearchParams({ page: String(pageNumber) })
  if (searchQuery?.trim()) params.set("query", searchQuery.trim())
  if (filters.sortBy && filters.sortBy !== "date_desc") params.set("sort", filters.sortBy)
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice))
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice))
  if (filters.inStock) params.set("inStock", "1")
  return `${path}?${params.toString()}#catalog`
}

export function findCatalogCategory(categories: CategoryTreeNode[], slug: string): CategoryTreeNode | undefined {
  for (const category of categories) {
    if (category.slug === slug) return category
    const child = findCatalogCategory(category.children, slug)
    if (child) return child
  }
}

export function getCatalogCategoryIds(category: CategoryTreeNode): string[] {
  return [category.id, ...category.children.flatMap(getCatalogCategoryIds)]
}
