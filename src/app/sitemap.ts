import type { MetadataRoute } from "next"

import { getCategories } from "@/lib/api/categories"
import { getProducts } from "@/lib/api/products"
import { getSiteOrigin } from "@/lib/config/site"
import { absoluteImage } from "@/lib/seo/structured-data"

export const revalidate = 300
const SITE_URL = getSiteOrigin()

function lastModified(value?: string): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isFinite(date.getTime()) && date.getTime() <= Date.now() ? date.toISOString() : undefined
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapUrl = (path: string) => new URL(path, `${SITE_URL}/`).toString()

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
      .filter((category) => category.slug && category.isActive)
      .map((category) => ({
        url: sitemapUrl(`/catalog/${encodeURIComponent(category.slug)}`),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...products
      .filter((product) => product.slug && product.isActive === true)
      .map((product) => ({
        url: sitemapUrl(`/product/${encodeURIComponent(product.slug)}`),
        lastModified: lastModified(product.updatedAt),
        changeFrequency: "daily" as const,
        priority: 0.8,
        images: absoluteImage(product.mainImageUrl)
          ? [absoluteImage(product.mainImageUrl)]
          : undefined,
      })),
  ]
}
