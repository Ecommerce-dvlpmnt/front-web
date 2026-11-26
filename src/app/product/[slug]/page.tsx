import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"

import { ProductReviews } from "@/components/product/ProductReviews"
import { getProductReviews } from "@/lib/api/reviews"
import { fallbackReviewSummary } from "@/features/reviews/review-utils"
import { ProductDetails } from "@/components/product/ProductDetails"
import { ProductViewTracker } from "@/components/product/ProductViewTracker"
import { RecommendedProducts } from "@/components/product/RecommendedProducts"
import { getCategories } from "@/lib/api/categories"
import { getProductBySlug, getProducts } from "@/lib/api/products"
import { getProductHeightVariants } from "@/lib/api/product-height-variants"
import { getProductOptions } from "@/lib/api/product-options"
import { getProductGalleryImages } from "@/features/product/product-utils"
import { getSeoData } from "@/lib/api/seo"
import { pageMetadata, productMetadataText } from "@/lib/seo/metadata"
import { absoluteImage, productGraph, serializeJsonLd } from "@/lib/seo/structured-data"
import { getGroupVariantMaps, recommendedGroups } from "@/features/catalog/group-products"

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product || product.isActive === false) notFound()

  const seo = await getSeoData("product", product.slug)
  const text = productMetadataText(product, seo)
  return pageMetadata(
    `/product/${encodeURIComponent(product.slug)}`,
    text.title,
    text.description,
    getProductGalleryImages(product).map((image) => absoluteImage(image.src)).filter(Boolean),
  )
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product || product.isActive === false) notFound()

  const [categories, heightVariants, productOptions, recommendedCandidates, seo, reviewResult] = await Promise.all([
    getCategories({ onlyActive: true }).catch(() => []),
    getProductHeightVariants(product).catch(() => []),
    getProductOptions(product),
    getProducts({ inStock: true, includeDetails: true }).catch(() => []),
    getSeoData("product", product.slug),
    getProductReviews(product.id).then((summary) => ({ summary, unavailable: false })).catch(() => ({ summary: fallbackReviewSummary(product), unavailable: true })),
  ])
  const suggestedGroups = recommendedGroups(recommendedCandidates, product, 12)
  const recommendedVariants = getGroupVariantMaps(suggestedGroups, recommendedCandidates)
  const category = categories.find((item) => item.id === product.categoryId)
  const jsonLd = productGraph(seo.jsonLd, product, category, reviewResult.summary)

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
          <ProductViewTracker product={product} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: serializeJsonLd(jsonLd),
            }}
          />
          <ProductDetails key={product.id} product={product} category={category} heightVariants={heightVariants} productOptions={productOptions} />
          <ProductReviews summary={reviewResult.summary} unavailable={reviewResult.unavailable} />
          <RecommendedProducts
            products={suggestedGroups.map((group) => group.product)}
            {...recommendedVariants}
          />
        </div>
      </div>
    </div>
  )
}
