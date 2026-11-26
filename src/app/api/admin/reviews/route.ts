import { requireAdminApiAccess } from "@/lib/api/admin/auth"
import { getAdminReviews } from "@/lib/api/admin/reviews-server"
import { apiErrorResponse } from "@/lib/api/admin/route-error"
import { reviewStatuses, type ReviewStatus } from "@/types/review"

export async function GET(request: Request) {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized
  const status = new URL(request.url).searchParams.get("status")
  if (status && !reviewStatuses.includes(status as ReviewStatus)) return Response.json({ detail: "Некоректний статус" }, { status: 400 })
  try { return Response.json(await getAdminReviews(status ? status as ReviewStatus : undefined)) }
  catch (error) { return apiErrorResponse(error, "Не вдалося завантажити відгуки") }
}
