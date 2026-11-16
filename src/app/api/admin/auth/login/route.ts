import { cookies } from "next/headers"
import { z } from "zod"

import { apiFetch } from "@/lib/api/client"
import {
  type AdminLoginResponse,
} from "@/lib/api/admin/auth"
import { ADMIN_SESSION_COOKIE } from "@/lib/api/admin/session"
import { apiErrorResponse } from "@/lib/api/admin/route-error"

const loginSchema = z.object({
  username: z.string().trim().min(3).max(30),
  password: z.string().min(6).max(100),
})

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json())
    if (!parsed.success) {
      return Response.json(
        { title: "Validation failed", detail: "Перевірте логін і пароль", status: 400 },
        { status: 400 },
      )
    }

    const result = await apiFetch<AdminLoginResponse>("admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    })

    if (!result.token || !result.expiresAt || result.admin?.role !== "Admin") {
      return Response.json(
        { title: "Unauthorized", detail: "Цей обліковий запис не має доступу до адмін-панелі", status: 403 },
        { status: 403 },
      )
    }

    const expiresAt = new Date(result.expiresAt)
    const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
    if (!Number.isFinite(maxAge) || maxAge === 0) {
      return Response.json(
        { title: "Unauthorized", detail: "Термін дії сесії завершився. Увійдіть ще раз.", status: 401 },
        { status: 401 },
      )
    }

    const cookieStore = await cookies()
    cookieStore.set(ADMIN_SESSION_COOKIE, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge,
      expires: expiresAt,
    })

    return Response.json({ admin: result.admin })
  } catch (error) {
    return apiErrorResponse(error, "Не вдалося увійти до адмін-панелі")
  }
}
