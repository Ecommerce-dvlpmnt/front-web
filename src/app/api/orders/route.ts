import { proxyBackendRequest } from "@/lib/api/public-proxy"

export async function POST(request: Request) {
  const body = await request.text()
  return proxyBackendRequest("orders", {
    method: "POST",
    headers: { "Content-Type": request.headers.get("content-type") ?? "application/json" },
    body,
  })
}
