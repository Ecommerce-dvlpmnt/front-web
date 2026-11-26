import { apiFetch } from "@/lib/api/client"
import { apiErrorResponse } from "@/lib/api/admin/route-error"
import { createReviewSchema } from "@/features/reviews/review-schema"
import type { Review } from "@/types/review"

export async function POST(request: Request) {
  const input = await request.json().catch(() => null)
  const parsed = createReviewSchema.safeParse(input)
  if (!parsed.success) return Response.json({ detail: "Перевірте ім’я (2–80 символів), оцінку (1–5) та текст (3–500 символів)." }, { status: 400 })
  try {
    const review = await apiFetch<Review>("reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data), cache: "no-store" })
    return Response.json(review, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося надіслати відгук")
  }
}
