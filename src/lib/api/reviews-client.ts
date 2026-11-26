import type { CreateReviewInput, Review } from "@/types/review"

export async function reviewResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.detail ?? payload?.title ?? payload?.message ?? "Не вдалося виконати запит. Спробуйте ще раз.")
  return payload as T
}

export async function submitReview(input: CreateReviewInput): Promise<Review> {
  return reviewResponse<Review>(await fetch("/api/reviews", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  }))
}
