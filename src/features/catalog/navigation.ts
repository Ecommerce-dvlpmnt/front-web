import type { CategoryTreeNode } from "@/types/category"

export type CatalogSearchParams = Record<string, string | string[] | undefined>

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
  pageNumber = 1,
}: { categorySlug?: string; searchQuery?: string; pageNumber?: number } = {}): string {
  const path = categorySlug ? `/catalog/${encodeURIComponent(categorySlug)}` : "/"
  const params = new URLSearchParams({ page: String(pageNumber) })
  if (searchQuery?.trim()) params.set("query", searchQuery.trim())
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
