import { requireAdminApiAccess, adminApiFetch } from "@/lib/api/admin/auth"
import { apiErrorResponse } from "@/lib/api/admin/route-error"
import { analyticsPeriods } from "@/lib/api/admin/analytics"

export async function GET(request: Request) {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized
  const period = new URL(request.url).searchParams.get("period") ?? "30d"
  if (!analyticsPeriods.some((value) => value === period)) {
    return Response.json({ title: "Validation failed", detail: "Невідомий період", status: 400 }, { status: 400 })
  }
  try {
    return Response.json(await adminApiFetch(`admin/analytics/summary?period=${period}`))
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося завантажити зведені показники")
  }
}
