import { revalidatePath } from "next/cache"

import {
  createProduct,
  getAdminProducts,
} from "@/lib/api/admin/products"
import { apiErrorResponse } from "@/lib/api/admin/route-error"
import {
  productSchema,
  toProductInput,
} from "@/features/admin/products/product-schema"

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams
    const onlyActive = params.get("onlyActive") === "true"
    const pageSizeValue = Number(params.get("pageSize"))

    return Response.json(
      await getAdminProducts({
        onlyActive,
        categoryId: params.get("categoryId") || undefined,
        supplierId: params.get("supplierId") || undefined,
        search: params.get("search") || undefined,
        pageSize:
          Number.isInteger(pageSizeValue) && pageSizeValue > 0
            ? pageSizeValue
            : undefined,
      })
    )
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося завантажити товари")
  }
}

export async function POST(request: Request) {
  try {
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

    const product = await createProduct(toProductInput(parsed.data))
    revalidatePath("/admin/products")

    return Response.json(product, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося створити товар")
  }
}
