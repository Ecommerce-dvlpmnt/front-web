import { getProducts } from "@/lib/api/products"

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
    return `${SITE_URL}/product-placeholder.svg`
  }
}

function formatPrice(value: number): string {
  return `${(Number.isFinite(value) ? value : 0).toFixed(2)} UAH`
}

export async function GET(): Promise<Response> {
  const products = await getProducts({ pageSize: 100 })

  const items = products
    .filter((product) => product.slug)
    .map((product) => {
      const title = product.name.trim() || product.sku || product.id
      const description =
        stripHtml(product.description ?? "") || title
      const imageUrl = absoluteUrl(
        product.mainImageUrl?.trim() || "/product-placeholder.svg"
      )
      const productUrl = absoluteUrl(
        `/product/${encodeURIComponent(product.slug)}`
      )

      return `
    <item>
      <g:id>${escapeXml(product.sku?.trim() || product.id)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:availability>${product.stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>
      <g:price>${formatPrice(product.price)}</g:price>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`
    })
    .join("")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Lumière — каталог товаров</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>Товары Lumière для Google Shopping</description>${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  })
}
