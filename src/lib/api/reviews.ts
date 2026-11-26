import { apiFetch } from "@/lib/api/client"
import { approvedReviewSummary } from "@/features/reviews/review-utils"
import type { ProductReviewsSummary } from "@/types/review"

export async function getProductReviews(productId: string): Promise<ProductReviewsSummary> {
  const summary = await apiFetch<ProductReviewsSummary>(`reviews/product/${encodeURIComponent(productId)}`, { cache: "no-store", signal: AbortSignal.timeout(8000) })
  return approvedReviewSummary(summary, productId)
}
