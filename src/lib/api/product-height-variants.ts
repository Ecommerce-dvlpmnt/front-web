import { getTreeHeightModel, selectHeightVariants, type ProductHeightVariant } from "@/features/product/height-variants"
import { getCatalogProductsPage } from "@/lib/api/products"
import type { Product } from "@/types/product"

export async function getProductHeightVariants(product: Product) {
  const model = getTreeHeightModel(product.name)
  if (!model || !product.categoryId || product.isActive !== true) return []
  // One bounded, cached Summary request. Never walk further pages or the full catalog.
  const page = await getCatalogProductsPage({ search: model.search, categoryId: product.categoryId })
  return selectHeightVariants(product, page.items)
}

export async function getCatalogHeightVariants(products: Product[]): Promise<Record<string, ProductHeightVariant[]>> {
  const variantsByProductId: Record<string, ProductHeightVariant[]> = {}
  const groups = new Map<string, { products: Product[]; search: string; categoryId: string }>()

  for (const product of products) {
    const model = getTreeHeightModel(product.name)
    if (!model || !product.categoryId || product.isActive !== true) continue
    const key = `${product.categoryId}:${model.key}`
    const group = groups.get(key)
    if (group) group.products.push(product)
    else groups.set(key, { products: [product], search: model.search, categoryId: product.categoryId })
  }

  const pending = [...groups.values()]
  let nextGroup = 0
  await Promise.all(Array.from({ length: Math.min(4, pending.length) }, async () => {
    while (nextGroup < pending.length) {
      const group = pending[nextGroup++]
      // The current catalog page still provides useful siblings if a targeted lookup fails.
      let candidates = products
      try {
        const page = await getCatalogProductsPage({ search: group.search, categoryId: group.categoryId })
        candidates = [...products, ...page.items]
      } catch {
        // Keep the initial product and any matching products already on this page.
      }
      for (const product of group.products) {
        variantsByProductId[product.id] = selectHeightVariants(product, candidates)
      }
    }
  }))

  return variantsByProductId
}
