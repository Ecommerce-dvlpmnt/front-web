export const reviewStatuses = ["Pending", "Approved", "Rejected"] as const
export type ReviewStatus = (typeof reviewStatuses)[number]

export interface Review {
  id: string
  productId: string
  productName?: string | null
  categoryId?: string | null
  categoryName?: string | null
  authorName: string
  rating: number
  comment: string
  pros?: string | null
  cons?: string | null
  status: ReviewStatus
  // Backend documents this as an internal moderation comment.
  adminComment?: string | null
  createdAt: string
}

export interface ProductReviewsSummary {
  productId: string
  averageRating: number
  totalReviews: number
  ratingDistribution: Record<string, number>
  reviews: Review[]
}

export interface AdminReview extends Review {
  productSlug?: string
  productSku?: string
}

export interface CreateReviewInput {
  productId: string
  authorName: string
  rating: number
  comment: string
  pros?: string
  cons?: string
  honeypot?: string
}
