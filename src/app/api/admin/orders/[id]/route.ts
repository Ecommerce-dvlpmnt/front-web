import { requireAdminApiAccess } from "@/lib/api/admin/auth"
import { apiErrorResponse } from "@/lib/api/admin/route-error"
import { getAdminOrder } from "@/lib/api/admin/orders-server"

interface OrderRouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: OrderRouteContext) {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    return Response.json(await getAdminOrder(id))
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося завантажити замовлення")
  }
}
