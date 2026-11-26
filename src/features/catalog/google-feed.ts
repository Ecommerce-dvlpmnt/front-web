import type { Product } from "@/types/product"
import { getTreeHeightModel } from "@/features/product/height-variants"
import { getProductOptionModel } from "@/features/product/variant-options"
import { getProductBrand } from "@/features/product/product-utils"
import { shopConfig } from "@/lib/config/shop"
import { getProductCommerce } from "@/features/product/product-commerce"

const PLACEHOLDER = "/product-placeholder.svg"
const GOOGLE_CATEGORY_BY_SLUG: Record<string, string> = {
  "lyti-yalynky": "6265", "premium-yalynky": "6265",
  "zasnizheni-yalynky": "6265", "v-horshchykakh": "6265",
  "yalynky-pvkh": "6265", "rizdvyani-vinky": "6267",
  "khvoyni-hirlyandy": "6267",
}

function plainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#(?:x[\da-f]+|\d+)|amp|lt|gt|quot|apos|nbsp);/giu, (match, entity: string) => {
      const names: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }
      if (entity.startsWith("#")) {
        const code = entity[1].toLowerCase() === "x"
          ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10)
        return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
          ? String.fromCodePoint(code) : ""
      }
      return names[entity.toLowerCase()] ?? match
    })
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
    .replace(/\s+/gu, " ").trim()
}

function limited(value: string, length: number): string {
  return Array.from(plainText(value)).slice(0, length).join("").trim()
}

function xml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;")
}

function tag(name: string, value: string): string {
  return value ? `\n      <g:${name}>${xml(value)}</g:${name}>` : ""
}

function attributes(product: Product): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(product.attributes ?? "{}")
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown> : {}
  } catch { return {} }
}

function attribute(data: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === "string" && value.trim()) return limited(value, 200)
    if (typeof value === "number" && Number.isFinite(value)) return String(value)
  }
  return ""
}

function imageUrl(value: string, apiUrl?: string): string {
  if (!value?.trim() || value.trim() === PLACEHOLDER) return ""
  try {
    const base = apiUrl ? new URL(apiUrl).origin : undefined
    const url = new URL(value.trim(), base)
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
        !url.hostname || url.hostname === "localhost" || url.hostname === "127.0.0.1") return ""
    return url.toString()
  } catch { return "" }
}

function variant(product: Product, data: Record<string, unknown>) {
  const tree = getTreeHeightModel(product.name)
  const option = getProductOptionModel(product)
  const size = attribute(data, "size", "Size", "Висота", "Довжина гірлянди") || tree?.height || option?.dimension || ""
  const color = attribute(data, "color", "Color", "Колір", "Колір хвої") || option?.color || ""
  if (tree) return { key: `${product.categoryId}:${tree.key}`, size, color }
  return { key: option && product.categoryId ? `${product.categoryId}:${option.key}` : "", size, color }
}

function groupId(key: string): string {
  let hash = 2166136261
  for (const char of key) {
    hash ^= char.codePointAt(0)!
    hash = Math.imul(hash, 16777619)
  }
  return `model-${(hash >>> 0).toString(16)}`
}

function amount(value: number): string {
  return `${value.toFixed(2)} UAH`
}

export function generateGoogleFeed(products: Product[], siteOrigin: string, apiUrl?: string): string {
  const eligible = products.filter((product) =>
    product.isActive === true && Number.isInteger(product.stock) && product.stock > 0 &&
    Boolean(product.id?.trim()) && Boolean(product.slug?.trim()) &&
    Boolean(limited(product.name, 150)) && product.name.trim() !== "Без назви" &&
    Number.isFinite(product.price) &&
    Number(product.price.toFixed(2)) > 0 && Boolean(imageUrl(product.mainImageUrl, apiUrl)))
  const groups = new Map<string, Array<{ size: string; color: string }>>()
  for (const product of eligible) {
    const v = variant(product, attributes(product))
    if (v.key) groups.set(v.key, [...(groups.get(v.key) ?? []), v])
  }
  const grouped = new Set([...groups].filter(([, variants]) =>
    variants.length > 1 && variants.every((item) => item.size || item.color) &&
    new Set(variants.map((item) => `${item.size.toLowerCase()}|${item.color.toLowerCase()}`)).size === variants.length &&
    (variants.every((item) => Boolean(item.size)) || variants.every((item) => Boolean(item.color))))
    .map(([key]) => key))

  const items = eligible.map((product) => {
    const data = attributes(product)
    const v = variant(product, data)
    const title = limited(product.name, 150)
    // The long API description may contain pasted characteristics from other SKUs.
    // Prefer the product-specific editorial summary when one exists.
    const description = limited(product.metaDescription || product.description || title, 5000) || title
    const { price: current, previous, onSale: sale } = getProductCommerce(product)
    const id = product.sku?.trim() || product.id
    const mainImage = imageUrl(product.mainImageUrl, apiUrl)
    const extras = [...new Set([...(product.images ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => imageUrl(image.url, apiUrl))
      .filter((url) => url && url !== mainImage))].slice(0, 10)
    const gtin = attribute(data, "gtin", "GTIN", "barcode", "barCode", "ean", "upc")
    const mpn = attribute(data, "mpn", "MPN", "manufacturerPartNumber")
    const hasFactoryIdentifier = Boolean(gtin || mpn)
    const brand = limited(getProductBrand(product) || (!hasFactoryIdentifier ? shopConfig.name : ""), 70)
    const identifierExists = hasFactoryIdentifier ? "" : "no"
    const category = /(?:LED|світлодіод|електричн|світлов)/iu.test(`${product.name} ${product.categoryName ?? ""}`) && /гірлянд/iu.test(product.name)
      ? "2608" : GOOGLE_CATEGORY_BY_SLUG[product.categorySlug ?? ""] ||
      (/вінк|гірлянд/iu.test(product.categoryName ?? "") ? "6267" :
        /ялин|сосн|смерек|туї/iu.test(product.categoryName ?? "") ? "6265" : "")
    const link = new URL(`/product/${encodeURIComponent(product.slug)}`, `${siteOrigin}/`).toString()
    return `\n    <item>${tag("id", id)}${tag("title", title)}${tag("description", description)}` +
      `${tag("link", link)}${tag("image_link", mainImage)}` +
      extras.map((url) => tag("additional_image_link", url)).join("") +
      `${tag("availability", "in_stock")}${tag("price", amount(sale ? previous : current))}` +
      `${sale ? tag("sale_price", amount(current)) : ""}${tag("brand", brand)}` +
      `${tag("gtin", gtin)}${tag("mpn", mpn)}${tag("condition", "new")}` +
      `${tag("identifier_exists", identifierExists)}` +
      `${grouped.has(v.key) ? tag("item_group_id", groupId(v.key)) : ""}` +
      `${tag("size", v.size)}${tag("color", v.color)}` +
      `${tag("google_product_category", category)}${tag("product_type", limited(product.categoryName ?? "", 750))}` +
      `\n    </item>`
  }).join("")

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n  <channel>\n` +
    `    <title>Jingle Decor — каталог товарів</title>\n` +
    `    <link>${xml(siteOrigin)}</link>\n` +
    `    <description>Товари Jingle Decor для Google Shopping</description>${items}\n` +
    `  </channel>\n</rss>`
}
