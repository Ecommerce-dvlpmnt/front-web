import { Suspense } from "react"

import { CatalogSkeleton } from "@/features/catalog/CatalogSkeleton"
import { StorefrontCatalog } from "@/features/catalog/StorefrontCatalog"
import { getCatalogPageNumber, getCatalogQuery, type CatalogSearchParams } from "@/features/catalog/navigation"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<CatalogSearchParams>
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const pageNumber = getCatalogPageNumber(query.page)
  const searchQuery = getCatalogQuery(query.query)

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Suspense key={`${slug}:${searchQuery}:${pageNumber}`} fallback={<CatalogSkeleton />}>
          <StorefrontCatalog categorySlug={slug} searchQuery={searchQuery} pageNumber={pageNumber} />
        </Suspense>
      </div>
    </div>
  )
}
