import type { Product } from "@/types/product"

export interface ProductGalleryImage {
  src: string
  alt: string
}

export function getProductGalleryImages(
  product: Product
): ProductGalleryImage[] {
  const images: ProductGalleryImage[] = []
  const seenUrls = new Set<string>()

  function addImage(src: string | null | undefined, alt: string) {
    const normalizedSrc = src?.trim()

    if (!normalizedSrc || seenUrls.has(normalizedSrc)) return

    seenUrls.add(normalizedSrc)
    images.push({ src: normalizedSrc, alt })
  }

  addImage(product.mainImageUrl, product.name)

  for (const image of [...(product.images ?? [])].sort(
    (left, right) => left.sortOrder - right.sortOrder
  )) {
    addImage(image.url, image.alt?.trim() || product.name)
  }

  return images
}

export function getProductMetaDescription(product: Product): string {
  const source =
    product.metaDescription?.trim() ||
    product.description?.trim() ||
    product.name
  const normalized = source.replace(/\s+/g, " ")

  if (normalized.length <= 160) return normalized

  return `${normalized.slice(0, 157).trimEnd()}…`
}

export function getProductDiscountPercent(product: Product): number | null {
  if (
    product.oldPrice == null ||
    product.oldPrice <= product.price ||
    product.oldPrice <= 0
  ) {
    return null
  }

  return Math.round((1 - product.price / product.oldPrice) * 100)
}

export function parseProductAttributes(
  attributes: string | null | undefined
): [string, unknown][] {
  if (!attributes?.trim()) return []

  try {
    const parsed: unknown = JSON.parse(attributes)

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return []
    }

    return Object.entries(parsed)
  } catch {
    return []
  }
}

export function formatProductAttributeLabel(key: string): string {
  const labels: Record<string, string> = {
    material: "Матеріал",
    weightG: "Вага, г",
    color: "Колір",
    size: "Розмір",
  }

  return (
    labels[key] ??
    key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (character) => character.toUpperCase())
  )
}

export function formatProductAttributeValue(value: unknown): string {
  if (value == null) return "—"
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  try {
    return JSON.stringify(value)
  } catch {
    return "—"
  }
}
