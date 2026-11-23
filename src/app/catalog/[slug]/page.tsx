import { Suspense } from "react"

import { CatalogSkeleton } from "@/features/catalog/CatalogSkeleton"
import { StorefrontCatalog } from "@/features/catalog/StorefrontCatalog"
import { CatalogFilters } from "@/features/catalog/CatalogFilters"
import { getCatalogFilters, getCatalogPageNumber, getCatalogQuery, type CatalogSearchParams } from "@/features/catalog/navigation"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<CatalogSearchParams>
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const pageNumber = getCatalogPageNumber(query.page)
  const searchQuery = getCatalogQuery(query.query)
  const filters = getCatalogFilters(query)

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div id="catalog" className="scroll-mt-24 pt-8 sm:pt-12">
          <CatalogFilters categorySlug={slug} searchQuery={searchQuery} filters={filters} />
          <div className="min-h-[520px] transition-opacity duration-300">
            <Suspense key={`${slug}:${searchQuery}:${pageNumber}:${JSON.stringify(filters)}`} fallback={<CatalogSkeleton />}>
              <StorefrontCatalog categorySlug={slug} searchQuery={searchQuery} pageNumber={pageNumber} filters={filters} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
