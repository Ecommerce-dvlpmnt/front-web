import { adminApiFetch, requireAdminApiAccess } from "@/lib/api/admin/auth"
import { apiErrorResponse } from "@/lib/api/admin/route-error"

export async function GET() {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized
  try {
    return Response.json(await adminApiFetch("admin/finance/exchange-rate"))
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося отримати курс НБУ")
  }
}
