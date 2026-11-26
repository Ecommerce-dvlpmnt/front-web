import type { Metadata } from "next"
import { siteUrl } from "@/lib/config/site"
import { cleanText } from "@/lib/seo/text"
import { getCatalogPageNumber, type CatalogSearchParams } from "@/features/catalog/navigation"
import type { Product } from "@/types/product"
import type { SeoPayload } from "@/lib/api/seo"

export function pageMetadata(path: string, title: string, description: string, images: string[] = [siteUrl("/og")]): Metadata {
  const url = siteUrl(path)
  const name = cleanText(title, 150)
  const summary = cleanText(description, 160)
  const socialImages = images.length > 0 ? images : [siteUrl("/og")]
  return {
    title: name, description: summary, alternates: { canonical: url },
    openGraph: { title: name, description: summary, url, type: "website", siteName: "Jingle Decor", locale: "uk_UA", images: socialImages },
    twitter: { card: "summary_large_image", title: name, description: summary, images: socialImages },
  }
}

export function catalogMetadata(path: string, title: string, description: string, params: CatalogSearchParams): Metadata {
  const page = getCatalogPageNumber(params.page)
  const filtered = ["query", "search", "sort", "minPrice", "maxPrice", "inStock"].some((key) => Boolean(params[key]))
  const canonical = page > 1 && !filtered ? `${path}?page=${page}` : path
  return {
    ...pageMetadata(canonical, page > 1 ? `${title} — сторінка ${page}` : title, description),
    robots: { index: !filtered, follow: true },
  }
}

export function productMetadataText(product: Product, seo: SeoPayload = {}) {
  const reference = cleanText(product.sku || product.id, 50)
  const titleSuffix = ` — ${reference} — Jingle Decor`
  const descriptionSuffix = ` Артикул: ${reference}.`
  const title = cleanText(product.metaTitle || seo.metaTitle || product.name)
    .replace(/\s*[—–-]?\s*(?:купити в інтернет-магазині\s*)?[«"]?Jingle Decor[»"]?\s*$/iu, "").trim() || cleanText(product.name)
  const description = cleanText(product.metaDescription || seo.metaDescription || product.description || product.name)
  return {
    title: `${cleanText(title, 150 - Array.from(titleSuffix).length)}${titleSuffix}`,
    description: `${cleanText(description, 160 - Array.from(descriptionSuffix).length)}${descriptionSuffix}`,
  }
}
