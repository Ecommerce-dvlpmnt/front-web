import { NextResponse, type NextRequest } from "next/server"

import { ADMIN_SESSION_COOKIE } from "@/lib/api/admin/session"
import { getCategories } from "@/lib/api/categories"

export async function proxy(request: NextRequest) {
  // Resolve legacy category URLs before rendering starts, so this is a real
  // HTTP redirect rather than a streamed meta-refresh with status 200.
  if (request.nextUrl.pathname === "/") {
    const value = request.nextUrl.searchParams.get("category")
    if (value) {
      const categories = await getCategories({ onlyActive: true }).catch(() => [])
      const category = categories.find((item) => item.slug === value || item.id === value)
      if (category) {
        const target = request.nextUrl.clone()
        target.pathname = `/catalog/${encodeURIComponent(category.slug)}`
        target.searchParams.delete("category")
        return NextResponse.redirect(target, 308)
      }
    }
    return NextResponse.next()
  }
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next()
  if (request.cookies.has(ADMIN_SESSION_COOKIE)) return NextResponse.next()

  const loginUrl = new URL("/admin/login", request.url)
  loginUrl.searchParams.set("next", request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/admin/:path*", "/"],
}
