import { normalizeSeoUrls } from "@/lib/api/seo"
import { siteUrl } from "@/lib/config/site"
import { cleanText } from "@/lib/seo/text"
import { getProductBrand, getProductGalleryImages } from "@/features/product/product-utils"
import { getProductCommerce } from "@/features/product/product-commerce"
import type { Product } from "@/types/product"
import { fallbackReviewSummary } from "@/features/reviews/review-utils"
import type { ProductReviewsSummary } from "@/types/review"
import type { Category } from "@/types/category"

type Node = Record<string, unknown>
function object(value: unknown): value is Node { return Boolean(value) && typeof value === "object" && !Array.isArray(value) }
function hasType(node: Node, type: string): boolean {
  return node["@type"] === type || Array.isArray(node["@type"]) && node["@type"].includes(type)
}

// Ignore backend rating claims; the Product node uses the visible approved reviews.
// FAQ markup is composed from the same content as the visible FAQ, never API claims.
function sanitize(value: unknown): unknown {
  if (typeof value === "string") return normalizeSeoUrls(value)
  if (Array.isArray(value)) return value.map(sanitize).filter((item) => item !== undefined)
  if (!object(value)) return value
  if (["FAQPage", "Product", "ProductGroup", "Review", "AggregateRating"].some((type) => hasType(value, type))) return undefined
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["aggregateRating", "review", "reviews", "@context", "potentialAction"].includes(key))
    .map(([key, item]) => [key, sanitize(item)]).filter(([, item]) => item !== undefined))
}

export function seoNodes(payload: unknown): Node[] {
  let data = payload
  if (typeof data === "string") {
    try { data = JSON.parse(data) } catch { return [] }
  }
  const source = Array.isArray(data) ? data : object(data) && Array.isArray(data["@graph"]) ? data["@graph"] : [data]
  const seen = new Set<string>()
  return source.flatMap((value) => {
    if (!object(value) || !value["@type"]) return []
    const node = sanitize(value)
    if (!object(node)) return []
    const key = String(node["@id"] ?? node["@type"])
    if (seen.has(key)) return []
    seen.add(key)
    return [node]
  })
}

export function graph(nodes: Node[]) { return { "@context": "https://schema.org", "@graph": nodes } }
export function serializeJsonLd(value: unknown): string { return JSON.stringify(value).replace(/</g, "\\u003c") }

export function absoluteImage(value: string): string {
  if (!value || value === "/product-placeholder.svg") return ""
  try {
    const url = new URL(value, process.env.API_URL ? new URL(process.env.API_URL).origin : siteUrl())
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password &&
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ? url.toString() : ""
  } catch { return "" }
}

export function productGraph(backend: unknown, product: Product, category?: Category, reviews: ProductReviewsSummary = fallbackReviewSummary(product)) {
  const url = siteUrl(`/product/${encodeURIComponent(product.slug)}`)
  const commerce = getProductCommerce(product)
  const brand = getProductBrand(product) || "Jingle Decor"
  const nodes = seoNodes(backend).filter((node) => !hasType(node, "BreadcrumbList"))
  nodes.push({ "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Головна", item: siteUrl() },
    ...(category ? [{ "@type": "ListItem", position: 2, name: cleanText(category.name), item: siteUrl(`/catalog/${encodeURIComponent(category.slug)}`) }] : []),
    { "@type": "ListItem", position: category ? 3 : 2, name: cleanText(product.name), item: url },
  ] })
  nodes.push({
    "@type": "Product", "@id": `${url}#product`, url,
    name: cleanText(product.name, 150), sku: product.sku,
    description: cleanText(product.metaDescription || product.description || product.name),
    image: getProductGalleryImages(product).map((image) => absoluteImage(image.src)).filter(Boolean),
    brand: { "@type": "Brand", name: brand },
    ...(reviews.productId === product.id && reviews.totalReviews > 0 && reviews.averageRating >= 1 && reviews.averageRating <= 5 ? {
      aggregateRating: { "@type": "AggregateRating", ratingValue: reviews.averageRating, reviewCount: reviews.totalReviews, bestRating: 5, worstRating: 1 },
      review: reviews.reviews.filter((review) => review.status === "Approved" && review.productId === product.id).map((review) => ({
        "@type": "Review", author: { "@type": "Person", name: review.authorName },
        datePublished: review.createdAt, reviewBody: review.comment,
        reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 },
      })),
    } : {}),
    offers: {
      "@type": "Offer", url, price: commerce.price, priceCurrency: commerce.currency,
      itemCondition: "https://schema.org/NewCondition",
      availability: `https://schema.org/${commerce.inStock ? "InStock" : "OutOfStock"}`,
    },
  })
  return graph(nodes)
}

export function categoryGraph(backend: unknown, category: Category, products: Product[], page: number) {
  const url = siteUrl(`/catalog/${encodeURIComponent(category.slug)}${page > 1 ? `?page=${page}` : ""}`)
  const nodes = seoNodes(backend).filter((node) => !hasType(node, "CollectionPage") && !hasType(node, "ItemList"))
  if (!nodes.some((node) => hasType(node, "BreadcrumbList"))) {
    nodes.push({ "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: siteUrl() },
      { "@type": "ListItem", position: 2, name: cleanText(category.name), item: siteUrl(`/catalog/${encodeURIComponent(category.slug)}`) },
    ] })
  }
  nodes.push({ "@type": "CollectionPage", "@id": url, url, name: cleanText(category.name), inLanguage: "uk-UA",
    mainEntity: { "@type": "ItemList", numberOfItems: products.length, itemListElement: products.map((product, index) => ({
      "@type": "ListItem", position: (page - 1) * 24 + index + 1,
      url: siteUrl(`/product/${encodeURIComponent(product.slug)}`), name: cleanText(product.name),
    })) },
  })
  return graph(nodes)
}
