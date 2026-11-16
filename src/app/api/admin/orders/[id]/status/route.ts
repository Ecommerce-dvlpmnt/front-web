import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdminApiAccess } from "@/lib/api/admin/auth"
import { apiErrorResponse } from "@/lib/api/admin/route-error"
import { setAdminOrderStatus } from "@/lib/api/admin/orders-server"
import { orderStatuses } from "@/lib/api/admin/orders"

const updateSchema = z.object({
  status: z.enum(orderStatuses),
  comment: z.string().nullable().optional(),
})

interface OrderRouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: OrderRouteContext) {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized

  try {
    const parsed = updateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return Response.json(
        { title: "Validation failed", detail: "Перевірте статус замовлення", status: 400, errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const { id } = await params
    const order = await setAdminOrderStatus(id, parsed.data)
    revalidatePath("/admin/orders")
    return Response.json(order)
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося змінити статус замовлення")
  }
}
