import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdminApiAccess } from "@/lib/api/admin/auth"
import { apiErrorResponse } from "@/lib/api/admin/route-error"
import { setAdminOrderComment } from "@/lib/api/admin/orders-server"

const updateSchema = z.object({ comment: z.string().nullable() })

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
        { title: "Validation failed", detail: "Перевірте коментар", status: 400, errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const { id } = await params
    const order = await setAdminOrderComment(id, parsed.data.comment)
    revalidatePath("/admin/orders")
    return Response.json(order)
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося зберегти коментар")
  }
}
