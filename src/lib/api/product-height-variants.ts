import { getTreeHeightModel, selectHeightVariants } from "@/features/product/height-variants"
import { getCatalogProductsPage } from "@/lib/api/products"
import type { Product } from "@/types/product"

export async function getProductHeightVariants(product: Product) {
  const model = getTreeHeightModel(product.name)
  if (!model || !product.categoryId || product.isActive !== true) return []
  // One bounded, cached Summary request. Never walk further pages or the full catalog.
  const page = await getCatalogProductsPage({ search: model.search, categoryId: product.categoryId })
  return selectHeightVariants(product, page.items)
}
