import { revalidatePath } from "next/cache"

import {
  deleteProduct,
  getAdminProduct,
  updateProduct,
} from "@/lib/api/admin/products"
import { apiErrorResponse } from "@/lib/api/admin/route-error"
import {
  productSchema,
  toProductInput,
} from "@/features/admin/products/product-schema"

interface ProductRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  _request: Request,
  { params }: ProductRouteContext
) {
  try {
    const { id } = await params
    const product = await getAdminProduct(id)

    if (!product) {
      return Response.json(
        { title: "Not Found", detail: "Товар не знайдено", status: 404 },
        { status: 404 }
      )
    }

    return Response.json(product)
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося завантажити товар")
  }
}

export async function PUT(
  request: Request,
  { params }: ProductRouteContext
) {
  try {
    const { id } = await params
    const parsed = productSchema.safeParse(await request.json())

    if (!parsed.success) {
      return Response.json(
        {
          title: "Validation failed",
          detail: "Перевірте заповнення форми товару",
          status: 400,
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const product = await updateProduct(id, toProductInput(parsed.data))
    revalidatePath("/admin/products")

    return Response.json(product)
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося оновити товар")
  }
}

export async function DELETE(
  _request: Request,
  { params }: ProductRouteContext
) {
  try {
    const { id } = await params
    await deleteProduct(id)
    revalidatePath("/admin/products")

    return Response.json({ success: true })
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося видалити товар")
  }
}
