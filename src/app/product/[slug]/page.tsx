import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import Link from "next/link"

import { ProductDetails } from "@/components/product/ProductDetails"
import { getCategories } from "@/lib/api/categories"
import { getProductBySlug } from "@/lib/api/products"
import { getProductGalleryImages, getProductMetaDescription } from "@/features/product/product-utils"

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getSiteOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (configuredOrigin) {
    return configuredOrigin.replace(/\/+$/, "")
  }

  const requestHeaders = await headers()
  const forwardedHost = requestHeaders.get("x-forwarded-host")
  const host = (forwardedHost ?? requestHeaders.get("host"))
    ?.split(",")[0]
    .trim()

  if (!host) return "http://localhost:3000"

  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")
    ?.split(",")[0]
    .trim()
  const protocol =
    forwardedProtocol ||
    (host.startsWith("localhost") || host.startsWith("127.")
      ? "http"
      : "https")

  return `${protocol}://${host}`
}

async function getProductUrl(slug: string) {
  const origin = await getSiteOrigin()
  return new URL(`/product/${encodeURIComponent(slug)}`, origin).toString()
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  const title =
    product.metaTitle?.trim() ||
    `${product.name} — купити в інтернет-магазині`
  const description = getProductMetaDescription(product)
  const productUrl = await getProductUrl(product.slug)
  const images = getProductGalleryImages(product).map((image) => ({
    url: image.src,
    alt: image.alt,
  }))

  return {
    title,
    description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title,
      description,
      url: productUrl,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((image) => image.url),
    },
  }
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  const categories = await getCategories({ onlyActive: true }).catch(() => [])
  const category = categories.find((item) => item.id === product.categoryId)
  const productUrl = await getProductUrl(product.slug)
  const galleryImages = getProductGalleryImages(product)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: galleryImages.map((image) => image.src),
    description:
      product.description?.trim() || getProductMetaDescription(product),
    sku: product.sku,
    identifier_exists: false,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "UAH",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: productUrl,
    },
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <nav
          className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
          aria-label="Хлібні крихти"
        >
          <Link href="/#catalog" className="hover:text-foreground">
            Каталог
          </Link>
          <span aria-hidden="true">/</span>
          {category ? (
            <>
              <Link
                href={`/catalog/${category.slug}`}
                className="hover:text-foreground"
              >
                {category.name}
              </Link>
              <span aria-hidden="true">/</span>
            </>
          ) : null}
          <span className="text-foreground" aria-current="page">
            {product.name}
          </span>
        </nav>

        <div className="py-8 sm:py-12">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
            }}
          />
          <ProductDetails product={product} category={category} />
        </div>
      </div>
    </div>
  )
}
