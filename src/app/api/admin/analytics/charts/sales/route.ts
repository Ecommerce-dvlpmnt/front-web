import { requireAdminApiAccess, adminApiFetch } from "@/lib/api/admin/auth"
import { apiErrorResponse } from "@/lib/api/admin/route-error"
import { analyticsPeriods } from "@/lib/api/admin/analytics"

export async function GET(request: Request) {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized
  const params = new URL(request.url).searchParams
  const period = params.get("period") ?? "7d"
  const interval = params.get("interval") ?? "day"
  if (!analyticsPeriods.some((value) => value === period) || interval !== "day") {
    return Response.json({ title: "Validation failed", detail: "Невірний період або інтервал графіка", status: 400 }, { status: 400 })
  }
  try {
    return Response.json(await adminApiFetch(`admin/analytics/charts/sales?period=${period}&interval=${interval}`))
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося завантажити графік продажів")
  }
}
