import { requireAdminApiAccess, adminApiFetch } from "@/lib/api/admin/auth"
import { apiErrorResponse } from "@/lib/api/admin/route-error"

export async function GET() {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized
  try {
    return Response.json(await adminApiFetch("admin/analytics/orders-breakdown"))
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося завантажити статистику замовлень")
  }
}
