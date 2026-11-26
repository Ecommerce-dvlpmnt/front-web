import { revalidatePath } from "next/cache"
import { requireAdminApiAccess } from "@/lib/api/admin/auth"
import { deleteAdminReview, getAdminReview } from "@/lib/api/admin/reviews-server"
import { apiErrorResponse } from "@/lib/api/admin/route-error"

interface Context { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Context) {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized
  try { return Response.json(await getAdminReview((await params).id)) }
  catch (error) { return apiErrorResponse(error, "Не вдалося завантажити відгук") }
}

export async function DELETE(_request: Request, { params }: Context) {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized
  try {
    await deleteAdminReview((await params).id)
    revalidatePath("/admin", "layout")
    revalidatePath("/product/[slug]", "page")
    return new Response(null, { status: 204 })
  } catch (error) { return apiErrorResponse(error, "Не вдалося видалити відгук") }
}
