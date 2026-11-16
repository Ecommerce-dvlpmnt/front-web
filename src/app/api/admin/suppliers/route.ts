import { revalidatePath } from "next/cache"

import {
  createSupplier,
  getSuppliers,
} from "@/lib/api/admin/suppliers"
import { apiErrorResponse } from "@/lib/api/admin/route-error"
import { requireAdminApiAccess } from "@/lib/api/admin/auth"
import {
  supplierSchema,
  toSupplierInput,
} from "@/features/admin/suppliers/supplier-schema"

export async function GET(request: Request) {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized
  try {
    const onlyActive =
      new URL(request.url).searchParams.get("onlyActive") === "true"

    return Response.json(await getSuppliers({ onlyActive }))
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося завантажити постачальників")
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized
  try {
    const parsed = supplierSchema.safeParse(await request.json())

    if (!parsed.success) {
      return Response.json(
        {
          title: "Validation failed",
          detail: "Перевірте заповнення форми",
          status: 400,
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const supplier = await createSupplier(toSupplierInput(parsed.data))
    revalidatePath("/admin/suppliers")

    return Response.json(supplier, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося створити постачальника")
  }
}
