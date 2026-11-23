import { notFound, redirect } from "next/navigation"

import { CatalogSection } from "@/components/catalog/CatalogSection"
import { buildCategoryTree, getCategories } from "@/lib/api/categories"
import { getCatalogProductsPage } from "@/lib/api/products"
import { shopConfig } from "@/lib/config/shop"
import { findCatalogCategory, getCatalogCategoryIds, getCatalogHref, type CatalogFilters } from "@/features/catalog/navigation"

interface StorefrontCatalogProps {
  pageNumber: number
  searchQuery: string
  categorySlug?: string
  filters?: CatalogFilters
}

export async function StorefrontCatalog({ pageNumber, searchQuery, categorySlug, filters = {} }: StorefrontCatalogProps) {
  const categoriesPromise = categorySlug
    ? getCategories({ onlyActive: true }).then(buildCategoryTree)
    : getCategories({ onlyActive: true }).then(buildCategoryTree).catch(() => [])
  const productPagePromise = categorySlug
    ? categoriesPromise.then((categories) => {
        const category = findCatalogCategory(categories, categorySlug)
        if (!category) notFound()
        const categoryIds = getCatalogCategoryIds(category)
        return getCatalogProductsPage({
          ...(categoryIds.length === 1 ? { categoryId: category.id } : { categoryIds }),
          search: searchQuery,
          ...filters,
          pageNumber,
        })
      })
    : getCatalogProductsPage({ search: searchQuery, pageNumber, ...filters })
  const [categories, productPage] = await Promise.all([categoriesPromise, productPagePromise])
  const category = categorySlug ? findCatalogCategory(categories, categorySlug) : undefined

  if (pageNumber > Math.max(1, productPage.totalPages)) {
    redirect(getCatalogHref({ categorySlug, searchQuery, filters, pageNumber: Math.max(1, productPage.totalPages) }))
  }

  return (
    <CatalogSection
      eyebrow={category ? "Категорія" : shopConfig.seasonal.catalogEyebrow}
      title={category?.name ?? shopConfig.seasonal.catalogTitle}
      description={searchQuery
        ? `Результати пошуку для «${searchQuery}».`
        : category ? "Зібрали товари цієї категорії, щоб вам було простіше обрати особливу річ."
          : "Обирайте подарунки та декор для особливих моментів."}
      productPage={productPage}
      categories={categories}
      activeCategorySlug={categorySlug}
      searchQuery={searchQuery}
      filters={filters}
    />
  )
}
