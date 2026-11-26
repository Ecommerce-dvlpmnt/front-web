import { getProductOptionModel, selectProductOptions } from "@/features/product/variant-options"
import { getTreeHeightModel } from "@/features/product/height-variants"
import { getProductOptionsSearchPage } from "@/lib/api/products"
import type { Product } from "@/types/product"

export async function getProductOptions(product: Product): Promise<Product[]> {
  const model = getProductOptionModel(product)
  if (!model || getTreeHeightModel(product.name) || !product.categoryId || product.isActive !== true) return []
  const linked = (product.variants ?? []).filter((variant) => variant.slug && variant.name).map((variant): Product => ({
    id: variant.id, name: variant.name, slug: variant.slug, price: variant.price,
    oldPrice: variant.oldPrice, stock: variant.inStock ? 1 : 0,
    mainImageUrl: "", categoryId: product.categoryId, isActive: true,
    showOnHomepage: variant.showOnHomepage, isRecommended: variant.isRecommended, isFeatured: variant.isFeatured,
  }))
  try {
    // Summary products carry each SKU's image and stock; linked DTOs add siblings
    // outside the bounded search page for PDP navigation.
    return selectProductOptions(product, [...await getProductOptionsSearchPage(model.search, product.categoryId), ...linked])
  } catch {
    return selectProductOptions(product, linked)
  }
}

export async function getCatalogProductOptions(products: Product[]): Promise<Record<string, Product[]>> {
  const result: Record<string, Product[]> = {}
  const groups = new Map<string, { products: Product[]; search: string; categoryId: string }>()
  for (const product of products) {
    const model = getProductOptionModel(product)
    if (!model || getTreeHeightModel(product.name) || !product.categoryId || product.isActive !== true) continue
    const key = `${product.categoryId}:${model.key}`
    const group = groups.get(key)
    if (group) group.products.push(product)
    else groups.set(key, { products: [product], search: model.search, categoryId: product.categoryId })
  }

  const pending = [...groups.values()]
  let next = 0
  await Promise.all(Array.from({ length: Math.min(4, pending.length) }, async () => {
    while (next < pending.length) {
      const group = pending[next++]
      let candidates = products
      try {
        candidates = [...products, ...await getProductOptionsSearchPage(group.search, group.categoryId)]
      } catch {
        // Visible cards still provide their sibling variants when the lookup fails.
      }
      for (const product of group.products) result[product.id] = selectProductOptions(product, candidates)
    }
  }))
  return result
}
