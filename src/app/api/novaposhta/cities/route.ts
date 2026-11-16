import { proxyBackendRequest } from "@/lib/api/public-proxy"

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams.get("search") ?? ""
  return proxyBackendRequest(`novaposhta/cities?search=${encodeURIComponent(search)}`)
}
