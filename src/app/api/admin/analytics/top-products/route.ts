import { requireAdminApiAccess, adminApiFetch } from "@/lib/api/admin/auth"
import { apiErrorResponse } from "@/lib/api/admin/route-error"

export async function GET(request: Request) {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized
  const rawLimit = Number(new URL(request.url).searchParams.get("limit") ?? 5)
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 5
  try {
    return Response.json(await adminApiFetch(`admin/analytics/top-products?limit=${limit}`))
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося завантажити популярні товари")
  }
}
