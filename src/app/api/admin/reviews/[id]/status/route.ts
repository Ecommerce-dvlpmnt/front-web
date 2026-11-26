import { revalidatePath } from "next/cache"
import { requireAdminApiAccess } from "@/lib/api/admin/auth"
import { setAdminReviewStatus } from "@/lib/api/admin/reviews-server"
import { apiErrorResponse } from "@/lib/api/admin/route-error"
import { reviewStatusSchema } from "@/features/reviews/review-schema"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized
  const parsed = reviewStatusSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ detail: "Перевірте статус відгуку" }, { status: 400 })
  try {
    const updated = await setAdminReviewStatus((await params).id, parsed.data)
    revalidatePath("/admin", "layout")
    revalidatePath("/product/[slug]", "page")
    return Response.json(updated)
  } catch (error) { return apiErrorResponse(error, "Не вдалося змінити статус відгуку") }
}
