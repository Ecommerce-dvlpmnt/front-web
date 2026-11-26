import { notFound, redirect } from "next/navigation"

import { CatalogSection } from "@/components/catalog/CatalogSection"
import { buildCategoryTree, getCategories } from "@/lib/api/categories"
import { getProducts } from "@/lib/api/products"
import { shopConfig } from "@/lib/config/shop"
import { getSeoData } from "@/lib/api/seo"
import { categoryGraph } from "@/lib/seo/structured-data"
import { findCatalogCategory, getCatalogCategoryIds, getCatalogHref, type CatalogFilters } from "@/features/catalog/navigation"
import { getGroupVariantMaps, groupProducts, homepageGroups, paginateGroups } from "@/features/catalog/group-products"

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
  const productsPromise = categorySlug
    ? categoriesPromise.then((categories) => {
        const category = findCatalogCategory(categories, categorySlug)
        if (!category) notFound()
        const categoryIds = getCatalogCategoryIds(category)
        return getProducts({
          includeDetails: true,
          ...(categoryIds.length === 1 ? { categoryId: category.id } : { categoryIds }),
          search: searchQuery,
          ...filters,
        })
      })
    : getProducts({ includeDetails: true, search: searchQuery, ...filters })
  const [categories, products] = await Promise.all([categoriesPromise, productsPromise])
  const category = categorySlug ? findCatalogCategory(categories, categorySlug) : undefined
  const home = !categorySlug
  const groups = home ? homepageGroups(products) : groupProducts(products, (product) => product.isFeatured === true)
  const productPage = paginateGroups(groups, pageNumber)

  if (pageNumber > Math.max(1, productPage.totalPages)) {
    redirect(getCatalogHref({ categorySlug, searchQuery, filters, pageNumber: Math.max(1, productPage.totalPages) }))
  }

  const pageGroups = groups.slice((pageNumber - 1) * productPage.pageSize, pageNumber * productPage.pageSize)
  const hasFilters = Boolean(filters.sortBy || filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.inStock)
  const allProducts = searchQuery || hasFilters ? await getProducts({ includeDetails: true }) : products
  const { heightVariantsByProductId, productOptionsByProductId } = getGroupVariantMaps(pageGroups, allProducts)
  const seo = category ? await getSeoData("category", category.slug) : undefined

  return (
    <CatalogSection
      structuredData={category ? categoryGraph(seo?.jsonLd, category, productPage.items, pageNumber) : undefined}
      eyebrow={category ? "Категорія" : shopConfig.seasonal.catalogEyebrow}
      title={category?.name ?? shopConfig.seasonal.catalogTitle}
      description={searchQuery
        ? `Результати пошуку для «${searchQuery}».`
        : category ? "Зібрали товари цієї категорії, щоб вам було простіше обрати особливу річ."
          : "Обирайте подарунки та декор для особливих моментів."}
      productPage={productPage}
      heightVariantsByProductId={heightVariantsByProductId}
      productOptionsByProductId={productOptionsByProductId}
      categories={categories}
      activeCategorySlug={categorySlug}
      searchQuery={searchQuery}
      filters={filters}
    />
  )
}
