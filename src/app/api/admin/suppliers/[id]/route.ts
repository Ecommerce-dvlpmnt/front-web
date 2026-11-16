import { getSupplier } from "@/lib/api/admin/suppliers"
import { apiErrorResponse } from "@/lib/api/admin/route-error"
import { requireAdminApiAccess } from "@/lib/api/admin/auth"

interface SupplierRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  _request: Request,
  { params }: SupplierRouteContext
) {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized
  try {
    const { id } = await params
    const supplier = await getSupplier(id)

    if (!supplier) {
      return Response.json(
        { title: "Not Found", detail: "Постачальника не знайдено", status: 404 },
        { status: 404 }
      )
    }

    return Response.json(supplier)
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося завантажити постачальника")
  }
}
