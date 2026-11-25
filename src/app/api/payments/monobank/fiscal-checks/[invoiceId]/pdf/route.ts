import { proxyBackendRequest } from "@/lib/api/public-proxy"

export async function GET(_request: Request, context: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await context.params
  const response = await proxyBackendRequest(`payments/monobank/fiscal-checks/${encodeURIComponent(invoiceId)}/pdf`)
  if (!response.ok) return response
  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/pdf",
      "Content-Disposition": "attachment; filename=receipt.pdf",
      "Cache-Control": "no-store",
    },
  })
}
