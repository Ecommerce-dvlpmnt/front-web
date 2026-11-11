import type { MetadataRoute } from "next"

import { getCategories } from "@/lib/api/categories"
import { getProducts } from "@/lib/api/products"

function escapeXmlUrl(value: string): string {
  return value.replaceAll("&", "&amp;")
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
    "http://localhost:3000"

  const sitemapUrl = (path: string) => escapeXmlUrl(`${origin}${path}`)

  const [products, categories] = await Promise.all([
    getProducts({ pageSize: 100 }).catch(() => []),
    getCategories({ onlyActive: true }).catch(() => []),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: sitemapUrl(""),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: sitemapUrl("/delivery-and-payment"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: sitemapUrl("/returns"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: sitemapUrl("/contacts"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: sitemapUrl("/privacy-policy"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: sitemapUrl("/terms"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ]

  return [
    ...staticPages,
    ...categories
      .filter((category) => category.slug)
      .map((category) => ({
        url: sitemapUrl(`/catalog/${encodeURIComponent(category.slug)}`),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...products
      .filter((product) => product.slug)
      .map((product) => ({
        url: sitemapUrl(`/product/${encodeURIComponent(product.slug)}`),
        lastModified: product.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
        images: product.mainImageUrl.startsWith("http")
          ? [escapeXmlUrl(product.mainImageUrl)]
          : undefined,
      })),
  ]
}
