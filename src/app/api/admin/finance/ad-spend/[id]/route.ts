import { revalidatePath } from "next/cache"

import { adminApiFetch, requireAdminApiAccess } from "@/lib/api/admin/auth"
import { apiErrorResponse } from "@/lib/api/admin/route-error"

interface SpendRouteContext { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, { params }: SpendRouteContext) {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized
  try {
    const { id } = await params
    await adminApiFetch(`admin/finance/ad-spend/${encodeURIComponent(id)}`, { method: "DELETE" })
    revalidatePath("/admin/analytics")
    return new Response(null, { status: 204 })
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося видалити витрати")
  }
}
