import { getTreeHeightModel, selectHeightVariants, type ProductHeightVariant } from "@/features/product/height-variants"
import { getProductOptionModel, selectProductOptions } from "@/features/product/variant-options"
import type { Product, ProductPage } from "@/types/product"

export interface ProductGroup {
  key: string
  product: Product
  variants: Product[]
}

export function getProductGroupKey(product: Product): string {
  const model = getProductOptionModel(product) ?? getTreeHeightModel(product.name)
  return model ? `${product.categoryId ?? ""}:${model.key}` : `sku:${product.id}`
}

export function groupProducts(products: Product[], preferred: (product: Product) => boolean = () => false): ProductGroup[] {
  const groups = new Map<string, ProductGroup>()
  for (const product of products) {
    if (!product.slug || product.isActive !== true || !Number.isFinite(product.price) || product.price <= 0) continue
    const key = getProductGroupKey(product)
    const group = groups.get(key)
    if (group) {
      group.variants.push(product)
      if (preferred(product) && !preferred(group.product)) group.product = product
    } else {
      groups.set(key, { key, product, variants: [product] })
    }
  }
  return [...groups.values()]
}

export function homepageGroups(products: Product[]): ProductGroup[] {
  const groups = groupProducts(products, (product) => product.isFeatured === true)
  // Choose a flagged SKU even when its sibling arrived on an earlier API page.
  for (const group of groups) {
    group.product = group.variants.find((product) => product.showOnHomepage === true) ?? group.product
  }
  return groups.sort((a, b) =>
    Number(b.product.showOnHomepage === true) - Number(a.product.showOnHomepage === true)
  )
}

export function recommendedGroups(products: Product[], current: Product, limit = 12): ProductGroup[] {
  const currentKey = getProductGroupKey(current)
  return groupProducts(products.filter((product) =>
    product.isRecommended === true && product.stock > 0 && getProductGroupKey(product) !== currentKey
  )).slice(0, limit)
}

export function paginateGroups(groups: ProductGroup[], pageNumber: number, pageSize = 24): ProductPage {
  if (!Number.isSafeInteger(pageNumber) || pageNumber < 1) throw new Error("Invalid catalog page number")
  return {
    items: groups.slice((pageNumber - 1) * pageSize, pageNumber * pageSize).map((group) => group.product),
    totalCount: groups.length,
    totalSkuCount: groups.reduce((count, group) => count + group.variants.length, 0),
    pageNumber,
    pageSize,
    totalPages: Math.ceil(groups.length / pageSize),
  }
}

export function getGroupVariantMaps(groups: ProductGroup[], allProducts: Product[] = groups.flatMap((group) => group.variants)) {
  const allGroups = new Map(groupProducts(allProducts).map((group) => [group.key, group.variants]))
  const heightVariantsByProductId: Record<string, ProductHeightVariant[]> = {}
  const productOptionsByProductId: Record<string, Product[]> = {}
  for (const group of groups) {
    const candidates = allGroups.get(group.key) ?? group.variants
    if (getTreeHeightModel(group.product.name)) {
      heightVariantsByProductId[group.product.id] = selectHeightVariants(group.product, candidates)
    } else {
      productOptionsByProductId[group.product.id] = selectProductOptions(group.product, candidates)
    }
  }
  return { heightVariantsByProductId, productOptionsByProductId }
}
