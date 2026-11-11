
import { HeroBanner } from "@/components/home/HeroBanner"
import { CatalogSection } from "@/components/catalog/CatalogSection"
import {
  buildCategoryTree,
  getCategories,
} from "@/lib/api/categories"
import { getProducts } from "@/lib/api/products"
import { shopConfig } from "@/lib/config/shop"

interface HomeProps {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined
  }>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams
  const rawQuery = params.query
  const query = (
    Array.isArray(rawQuery) ? rawQuery[0] : rawQuery
  )?.trim() ?? ""
  const [products, categories] = await Promise.all([
    getProducts({ search: query }),
    getCategories({ onlyActive: true })
      .then(buildCategoryTree)
      .catch(() => []),
  ])

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <HeroBanner />

        <CatalogSection
          eyebrow={shopConfig.seasonal.catalogEyebrow}
          title={shopConfig.seasonal.catalogTitle}
          description={
            query
              ? `Результати пошуку для «${query}».`
              : "Обирайте подарунки та декор для особливих моментів."
          }
          products={products}
          categories={categories}
          searchQuery={query}
        />
      </div>
    </div>
  )
}
