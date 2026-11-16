import { cookies } from "next/headers"

import { ApiError, apiFetch } from "@/lib/api/client"
import { ADMIN_SESSION_COOKIE } from "@/lib/api/admin/session"

export { ADMIN_SESSION_COOKIE } from "@/lib/api/admin/session"

export interface AdminUser {
  id: string
  username: string
  name: string
  email: string | null
  role: string
  telegramId: number | null
  isActive: boolean
  createdAt: string
}

export interface AdminLoginResponse {
  token: string
  tokenType: string
  expiresAt: string
  admin: AdminUser
}

function isAdminUser(value: unknown): value is AdminUser {
  if (!value || typeof value !== "object") return false
  const admin = value as Partial<AdminUser>
  return typeof admin.id === "string" &&
    typeof admin.username === "string" &&
    typeof admin.role === "string" &&
    typeof admin.isActive === "boolean"
}

export async function getAdminToken(): Promise<string | null> {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value ?? null
}

type AdminApiRequestInit = RequestInit & {
  next?: { revalidate?: number; tags?: string[] }
}

export async function adminApiFetch<T>(path: string, init?: AdminApiRequestInit): Promise<T> {
  const token = await getAdminToken()
  if (!token) throw new ApiError("Потрібно увійти до адмін-панелі", 401)

  const headers = new Headers(init?.headers)
  headers.set("Authorization", `Bearer ${token}`)

  return apiFetch<T>(path, {
    method: init?.method,
    headers,
    body: init?.body,
    cache: "no-store",
  })
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const admin = await adminApiFetch<unknown>("admin/auth/me")
    return isAdminUser(admin) && admin.role === "Admin" && admin.isActive
      ? admin
      : null
  } catch {
    return null
  }
}

export async function requireAdminApiAccess(): Promise<Response | null> {
  return (await getCurrentAdmin())
    ? null
    : Response.json(
        { title: "Unauthorized", detail: "Потрібно увійти до адмін-панелі", status: 401 },
        { status: 401 },
      )
}
