import { proxyBackendRequest } from "@/lib/api/public-proxy"

export async function GET(_request: Request, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params
  return proxyBackendRequest(`orders/by-public-id/${encodeURIComponent(publicId)}`)
}
