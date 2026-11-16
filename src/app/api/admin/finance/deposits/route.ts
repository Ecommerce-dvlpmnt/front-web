import { revalidatePath } from "next/cache"
import { z } from "zod"

import { adminApiFetch, requireAdminApiAccess } from "@/lib/api/admin/auth"
import { apiErrorResponse } from "@/lib/api/admin/route-error"

const requestSchema = z.object({
  adminId: z.string().uuid().nullable().optional(),
  amount: z.number().finite().positive(),
  currency: z.enum(["UAH", "USD"]),
  customExchangeRate: z.number().finite().positive().nullable().optional(),
  date: z.string().datetime().nullable().optional(),
  note: z.string().nullable().optional(),
})

export async function GET() {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized
  try {
    return Response.json(await adminApiFetch("admin/finance/deposits"))
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося завантажити внески партнерів")
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApiAccess()
  if (unauthorized) return unauthorized
  try {
    const parsed = requestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return Response.json({ title: "Validation failed", detail: "Перевірте суму та валюту внеску", status: 400, errors: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const result = await adminApiFetch("admin/finance/deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    })
    revalidatePath("/admin/analytics")
    return Response.json(result, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося внести депозит")
  }
}
