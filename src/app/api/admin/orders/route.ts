import { z } from "zod"

import { requireAdminApiAccess } from "@/lib/api/admin/auth"
import { apiErrorResponse } from "@/lib/api/admin/route-error"
import { getAdminOrders } from "@/lib/api/admin/orders-server"
import { orderStatuses } from "@/lib/api/admin/orders"

const statusSchema = z.enum(orderStatuses)

export async function GET(request: Request) {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized

  try {
    const params = new URL(request.url).searchParams
    const rawStatus = params.get("status")
    const status = rawStatus ? statusSchema.safeParse(rawStatus) : null
    if (status && !status.success) {
      return Response.json(
        { title: "Validation failed", detail: "Невідомий статус замовлення", status: 400 },
        { status: 400 },
      )
    }

    const pageNumber = Number(params.get("pageNumber") ?? 1)
    const pageSize = Number(params.get("pageSize") ?? 50)
    return Response.json(await getAdminOrders({
      status: status?.success ? status.data : undefined,
      search: params.get("search") || undefined,
      from: params.get("from") || undefined,
      to: params.get("to") || undefined,
      pageNumber: Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1,
      pageSize: Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : 50,
    }))
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося завантажити замовлення")
  }
}
