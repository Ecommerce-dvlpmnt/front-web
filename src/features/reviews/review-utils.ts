import type { Product } from "@/types/product"
import type { AdminReview, ProductReviewsSummary, ReviewStatus } from "@/types/review"

export const reviewStatusLabels: Record<ReviewStatus, string> = {
  Pending: "На модерації", Approved: "Схвалено", Rejected: "Відхилено",
}

export function fallbackReviewSummary(product: Product): ProductReviewsSummary {
  const count = product.reviewCount
  const score = product.averageRating
  const valid = Number.isSafeInteger(count) && Number(count) > 0 && Number.isFinite(score) && Number(score) >= 1 && Number(score) <= 5
  return { productId: product.id, totalReviews: valid ? Number(count) : 0, averageRating: valid ? Number(score) : 0, ratingDistribution: {}, reviews: [] }
}

export function approvedReviewSummary(summary: ProductReviewsSummary, productId: string): ProductReviewsSummary {
  if (summary.productId !== productId || !Array.isArray(summary.reviews)) throw new Error("Invalid reviews response")
  const reviews = summary.reviews.filter((review) =>
    review.productId === productId && review.status === "Approved" &&
    Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5 &&
    typeof review.authorName === "string" && typeof review.comment === "string" &&
    Number.isFinite(Date.parse(review.createdAt))
  ).map((review) => {
    const publicReview = { ...review }
    delete publicReview.adminComment
    return publicReview
  })
  if (reviews.length && (summary.totalReviews !== reviews.length || !Number.isFinite(summary.averageRating) || summary.averageRating < 1 || summary.averageRating > 5)) {
    throw new Error("Invalid reviews statistics")
  }
  return {
    productId, reviews, totalReviews: reviews.length,
    averageRating: reviews.length ? summary.averageRating : 0,
    ratingDistribution: summary.ratingDistribution ?? {},
  }
}

export function filterAdminReviews(reviews: AdminReview[], status: ReviewStatus | "all", search: string): AdminReview[] {
  const query = search.trim().toLocaleLowerCase("uk-UA")
  return reviews.filter((review) => (status === "all" || review.status === status) &&
    (!query || [review.productName, review.productSku, review.authorName].some((value) => value?.toLocaleLowerCase("uk-UA").includes(query))))
}

export function reviewDate(value: string): string {
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium", timeZone: "Europe/Kyiv" }).format(date) : "—"
}
