import { reviewResponse } from "@/lib/api/reviews-client"
import type { Review, ReviewStatus } from "@/types/review"

export async function updateReviewStatus(id: string, status: ReviewStatus): Promise<Review> {
  return reviewResponse<Review>(await fetch(`/api/admin/reviews/${encodeURIComponent(id)}/status`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
  }))
}

export async function removeReview(id: string): Promise<void> {
  await reviewResponse<void>(await fetch(`/api/admin/reviews/${encodeURIComponent(id)}`, { method: "DELETE" }))
}
