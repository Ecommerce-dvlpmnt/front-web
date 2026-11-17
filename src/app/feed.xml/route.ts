import { getProducts } from "@/lib/api/products"
import { shopConfig } from "@/lib/config/shop"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
  "http://localhost:3000"

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

function absoluteUrl(value: string): string {
  try {
    return new URL(value, `${SITE_URL}/`).toString()
  } catch {
    return ""
  }
}

function formatPrice(value: number): string {
  return `${value.toFixed(2)} UAH`
}

function getProductIdentifiers(attributes: string | null | undefined) {
  if (!attributes) return { gtin: "", mpn: "" }

  try {
    const parsed: unknown = JSON.parse(attributes)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { gtin: "", mpn: "" }
    }

    const values = parsed as Record<string, unknown>
    const read = (...keys: string[]) => {
      for (const key of keys) {
        const value = values[key]
        if (typeof value === "string" && value.trim()) return value.trim()
        if (typeof value === "number" && Number.isFinite(value)) return String(value)
      }
      return ""
    }

    return {
      gtin: read("gtin", "GTIN", "barcode", "barCode", "ean", "upc"),
      mpn: read("mpn", "MPN", "manufacturerPartNumber"),
    }
  } catch {
    return { gtin: "", mpn: "" }
  }
}

export async function GET(): Promise<Response> {
  const products = await getProducts({ pageSize: 100 })

  const items = products
    .filter(
      (product) =>
        product.slug &&
        typeof product.price === "number" &&
        Number.isFinite(product.price) &&
        product.price > 0 &&
        Boolean(product.mainImageUrl?.trim()) &&
        product.mainImageUrl.trim() !== "/product-placeholder.svg" &&
        Boolean(absoluteUrl(product.mainImageUrl.trim()))
    )
    .map((product) => {
      const title = product.name.trim() || product.sku || product.id
      const description =
        stripHtml(product.description ?? "") || title
      const imageUrl = absoluteUrl(product.mainImageUrl.trim())
      const productUrl = absoluteUrl(
        `/product/${encodeURIComponent(product.slug)}`
      )
      const identifiers = getProductIdentifiers(product.attributes)
      const productBrand = (() => {
        try {
          const attributes = JSON.parse(product.attributes || "{}") as Record<string, unknown>
          return typeof attributes.brand === "string" && attributes.brand.trim()
            ? attributes.brand.trim()
            : shopConfig.brand
        } catch {
          return shopConfig.brand
        }
      })()
      const identifierExists = Boolean(identifiers.gtin || identifiers.mpn)

      return `
    <item>
      <g:id>${escapeXml(product.sku?.trim() || product.id)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:availability>${product.stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>
      <g:price>${formatPrice(product.price)}</g:price>
      ${productBrand ? `<g:brand>${escapeXml(productBrand)}</g:brand>` : ""}
      ${identifiers.gtin ? `<g:gtin>${escapeXml(identifiers.gtin)}</g:gtin>` : ""}
      ${identifiers.mpn ? `<g:mpn>${escapeXml(identifiers.mpn)}</g:mpn>` : ""}
      <g:condition>new</g:condition>
      ${identifierExists ? "" : "<g:identifier_exists>no</g:identifier_exists>"}
    </item>`
    })
    .join("")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Jingle Decor — каталог товарів</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>Товари Jingle Decor для Google Shopping</description>${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  })
}
