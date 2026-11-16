import { proxyBackendRequest } from "@/lib/api/public-proxy"

export async function GET(request: Request) {
  const cityRef = new URL(request.url).searchParams.get("cityRef") ?? ""
  return proxyBackendRequest(`novaposhta/warehouses?cityRef=${encodeURIComponent(cityRef)}`)
}
