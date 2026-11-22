import { getTreeHeightModel, selectHeightVariants, type ProductHeightVariant } from "@/features/product/height-variants"
import type { Product } from "@/types/product"

const requests = new Map<string, { expires: number; promise: Promise<ProductHeightVariant[]> }>()

export async function loadProductHeightVariants(product: Product): Promise<ProductHeightVariant[]> {
  const model = getTreeHeightModel(product.name)
  if (!model || !product.categoryId) return []
  const key = `${product.categoryId}:${model.key}`
  let request = requests.get(key)
  if (!request || request.expires <= Date.now()) {
    const promise = fetch(`/api/products/${encodeURIComponent(product.slug)}/height-variants`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Не вдалося завантажити висоти")
        const variants: unknown = await response.json()
        if (!Array.isArray(variants) || variants.length > 25 || !variants.every((variant) =>
          variant && typeof variant.id === "string" && typeof variant.name === "string" &&
          typeof variant.slug === "string" && typeof variant.price === "number" &&
          typeof variant.stock === "number" && typeof variant.mainImageUrl === "string"
        )) throw new Error("Некоректна відповідь варіантів товару")
        return variants as ProductHeightVariant[]
      })
    request = { expires: Date.now() + 300_000, promise }
    requests.set(key, request)
    promise.catch(() => { if (requests.get(key)?.promise === promise) requests.delete(key) })
  }
  // A second card of the same model retains its own current SKU even outside the search page.
  return selectHeightVariants(product, await request.promise)
}
