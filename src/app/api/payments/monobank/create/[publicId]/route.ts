import { proxyBackendRequest } from "@/lib/api/public-proxy"

export async function POST(_request: Request, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params
  return proxyBackendRequest(`payments/monobank/create/${encodeURIComponent(publicId)}`, { method: "POST" })
}
