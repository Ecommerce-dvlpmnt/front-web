import { cookies } from "next/headers"

import { ADMIN_SESSION_COOKIE } from "@/lib/api/admin/session"

export async function POST() {
  (await cookies()).delete(ADMIN_SESSION_COOKIE)
  return Response.json({ success: true })
}
