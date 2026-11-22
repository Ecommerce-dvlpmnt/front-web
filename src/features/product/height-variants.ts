import type { Product } from "@/types/product"

export interface ProductHeightVariant extends Pick<Product,
  "id" | "name" | "slug" | "price" | "oldPrice" | "stock" | "sku" |
  "mainImageUrl" | "categoryId" | "categoryName" | "isActive" | "badge"
> {
  height: string
}

export function getTreeHeightModel(name: string) {
  // Match whole Ukrainian tree nouns, not decorations such as "ялинкові кулі".
  if (!/(?:^|[^\p{L}])(?:ялинка|ялина|сосна|смерека|туя)(?=$|[^\p{L}])/iu.test(name)) return null
  const heights = [...name.matchAll(/(?<![\p{L}\p{N}.,])(\d+(?:[.,]\d+)?)\s*(см|м)(?![\p{L}\p{N}])/giu)]
  if (heights.length !== 1) return null
  const match = heights[0]
  const meters = Number(match[1].replace(",", ".")) / (match[2].toLowerCase() === "см" ? 100 : 1)
  if (!Number.isFinite(meters) || meters <= 0) return null
  const before = name.slice(0, match.index)
  const after = name.slice(match.index + match[0].length)
  const key = `${before} ${after}`.normalize("NFKC").toLocaleLowerCase("uk-UA")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/)
    .map((word) => word === "ялина" ? "ялинка" : word).join(" ")
  // Search must be a contiguous substring: a height can also occur mid-name.
  const search = [before, after].map((part) => part.replace(/^[\s,()]+|[\s,()]+$/g, ""))
    .sort((a, b) => b.length - a.length)[0]
  if (!key || !search) return null
  return { key, search, meters, height: `${Number(meters.toFixed(2))} м` }
}

export function selectHeightVariants(product: Product, candidates: Product[]): ProductHeightVariant[] {
  const model = getTreeHeightModel(product.name)
  if (!model || product.isActive !== true) return []
  const seen = new Set<string>()
  const seenHeights = new Set<number>()
  return [product, ...candidates].flatMap((candidate) => {
    const heightModel = getTreeHeightModel(candidate.name)
    if (candidate.isActive !== true || !candidate.slug || seen.has(candidate.id) ||
        candidate.categoryId !== product.categoryId || heightModel?.key !== model.key || seenHeights.has(heightModel.meters) ||
        !Number.isFinite(candidate.price) || !Number.isInteger(candidate.stock) || candidate.stock < 0) return []
    seen.add(candidate.id)
    seenHeights.add(heightModel.meters)
    // Copy the candidate's fields explicitly; never fill them from another height.
    return [{
      id: candidate.id, name: candidate.name, slug: candidate.slug,
      price: candidate.price, oldPrice: candidate.oldPrice, stock: candidate.stock,
      sku: candidate.sku, mainImageUrl: candidate.mainImageUrl,
      categoryId: candidate.categoryId, categoryName: candidate.categoryName,
      isActive: candidate.isActive, badge: candidate.badge, height: heightModel.height,
    }]
  }).sort((a, b) => getTreeHeightModel(a.name)!.meters - getTreeHeightModel(b.name)!.meters || a.id.localeCompare(b.id))
}
