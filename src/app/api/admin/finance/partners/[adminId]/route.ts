import { revalidatePath } from "next/cache"
import { z } from "zod"

import { adminApiFetch, requireAdminApiAccess } from "@/lib/api/admin/auth"
import { apiErrorResponse } from "@/lib/api/admin/route-error"

const requestSchema = z.object({
  role: z.string().trim().max(100).nullable().optional(),
  fixedSharePercent: z.number().finite().min(0).max(100).nullable().optional(),
})

interface PartnerRouteContext { params: Promise<{ adminId: string }> }

export async function PATCH(request: Request, { params }: PartnerRouteContext) {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized
  try {
    const parsed = requestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return Response.json({ title: "Validation failed", detail: "Перевірте роль і частку партнера", status: 400, errors: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { adminId } = await params
    await adminApiFetch(`admin/finance/partners/${encodeURIComponent(adminId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    })
    revalidatePath("/admin/analytics")
    return new Response(null, { status: 204 })
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося оновити налаштування партнера")
  }
}
