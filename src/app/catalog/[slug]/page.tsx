import { notFound } from "next/navigation"

import { CatalogSection } from "@/components/catalog/CatalogSection"
import {
  buildCategoryTree,
  getCategories,
  getCategoryBySlug,
} from "@/lib/api/categories"
import { getProducts } from "@/lib/api/products"

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function CategoryPage({
  params,
}: CategoryPageProps) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const [products, categories] = await Promise.all([
    getProducts({ categoryId: category.id }),
    getCategories({ onlyActive: true })
      .then(buildCategoryTree)
      .catch(() => []),
  ])

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <CatalogSection
          eyebrow="Категорія"
          title={category.name}
          description="Зібрали товари цієї категорії, щоб вам було простіше обрати особливу річ."
          products={products}
          categories={categories}
          activeCategorySlug={category.slug}
        />
      </div>
    </div>
  )
}
