import { requireAdminApiAccess, adminApiFetch } from "@/lib/api/admin/auth"
import { apiErrorResponse } from "@/lib/api/admin/route-error"

export async function GET(request: Request) {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized
  const rawThreshold = Number(new URL(request.url).searchParams.get("threshold") ?? 5)
  const threshold = Number.isInteger(rawThreshold) && rawThreshold >= 0 ? rawThreshold : 5
  try {
    return Response.json(await adminApiFetch(`admin/analytics/low-stock?threshold=${threshold}`))
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося завантажити товари з малим залишком")
  }
}
