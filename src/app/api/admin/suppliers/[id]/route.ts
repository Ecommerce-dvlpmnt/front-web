import { revalidatePath } from "next/cache"

import {
  deleteSupplier,
  getSupplier,
  updateSupplier,
} from "@/lib/api/admin/suppliers"
import { apiErrorResponse } from "@/lib/api/admin/route-error"
import {
  supplierSchema,
  toSupplierInput,
} from "@/features/admin/suppliers/supplier-schema"

interface SupplierRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  _request: Request,
  { params }: SupplierRouteContext
) {
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

export async function PUT(
  request: Request,
  { params }: SupplierRouteContext
) {
  try {
    const { id } = await params
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

    const supplier = await updateSupplier(id, toSupplierInput(parsed.data))
    revalidatePath("/admin/suppliers")

    return Response.json(supplier)
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося оновити постачальника")
  }
}

export async function DELETE(
  _request: Request,
  { params }: SupplierRouteContext
) {
  try {
    const { id } = await params
    await deleteSupplier(id)
    revalidatePath("/admin/suppliers")

    return Response.json({ success: true })
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося видалити постачальника")
  }
}
