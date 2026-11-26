import { adminApiFetch } from "@/lib/api/admin/auth"
import { getAdminProduct } from "@/lib/api/admin/products"
import type { AdminReview, Review, ReviewStatus } from "@/types/review"

// The API returns a plain array (no total count); walk every page for complete search/counts.
export async function getAdminReviews(status?: ReviewStatus): Promise<Review[]> {
  const reviews: Review[] = []
  const seen = new Set<string>()
  for (let page = 1; ; page++) {
    const query = new URLSearchParams({ page: String(page), pageSize: "100" })
    if (status) query.set("status", status)
    const batch = await adminApiFetch<Review[]>(`admin/reviews?${query}`)
    if (!Array.isArray(batch)) throw new Error("Invalid reviews response")
    if (!batch.length) break
    for (const review of batch) {
      if (seen.has(review.id)) throw new Error("Backend repeated a reviews page")
      seen.add(review.id)
      reviews.push(review)
    }
  }
  return reviews
}

export async function getAdminReviewsWithProducts(): Promise<AdminReview[]> {
  const reviews = await getAdminReviews()
  const ids = [...new Set(reviews.map((review) => review.productId))]
  const products = new Map<string, Awaited<ReturnType<typeof getAdminProduct>>>()
  for (let offset = 0; offset < ids.length; offset += 4) {
    await Promise.all(ids.slice(offset, offset + 4).map(async (id) => {
      products.set(id, await getAdminProduct(id))
    }))
  }
  return reviews.map((review) => {
    const product = products.get(review.productId)
    return { ...review, productName: product?.name ?? review.productName, productSlug: product?.slug, productSku: product?.sku }
  })
}

export async function getAdminReview(id: string) {
  return adminApiFetch<Review>(`admin/reviews/${encodeURIComponent(id)}`)
}

export async function setAdminReviewStatus(id: string, input: { status: ReviewStatus; adminComment?: string | null }) {
  return adminApiFetch<Review>(`admin/reviews/${encodeURIComponent(id)}/status`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  })
}

export async function deleteAdminReview(id: string) {
  return adminApiFetch<void>(`admin/reviews/${encodeURIComponent(id)}`, { method: "DELETE" })
}
