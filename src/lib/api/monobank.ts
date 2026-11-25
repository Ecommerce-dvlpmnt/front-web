export interface MonobankOrderStatus {
  orderPublicId: string
  orderNumber: number
  totalPrice: number
  paymentStatus: "Pending" | "Paid" | "Failed" | "Refunded"
  orderStatus: string
  invoiceId?: string | null
  isPaid: boolean
  canRetryPayment: boolean
  receiptAvailable: boolean
}

async function readPaymentResponse(response: Response, fallback: string): Promise<unknown> {
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const problem = body && typeof body === "object" ? body as Record<string, unknown> : {}
    if (response.status === 404) throw new Error("Онлайн-оплата зараз недоступна. Замовлення збережено — спробуйте пізніше.")
    throw new Error(typeof problem.detail === "string" ? problem.detail :
      typeof problem.title === "string" ? problem.title : fallback)
  }
  return body
}

export async function createMonobankInvoice(publicId: string): Promise<string> {
  const response = await fetch(`/api/payments/monobank/create/${encodeURIComponent(publicId)}`, {
    method: "POST",
    cache: "no-store",
  })
  const body = await readPaymentResponse(response, "Не вдалося створити рахунок для оплати.")
  const pageUrl = body && typeof body === "object" ? (body as Record<string, unknown>).pageUrl : null
  if (typeof pageUrl !== "string") throw new Error("Сервер не повернув посилання на оплату.")
  try {
    if (new URL(pageUrl).protocol === "https:") return pageUrl
  } catch { /* Invalid URL is handled below. */ }
  throw new Error("Сервер повернув некоректне посилання на оплату.")
}

export async function getMonobankOrderStatus(publicId: string, signal?: AbortSignal): Promise<MonobankOrderStatus> {
  const response = await fetch(`/api/payments/monobank/order-status/${encodeURIComponent(publicId)}`, {
    cache: "no-store",
    signal,
  })
  const body = await readPaymentResponse(response, "Не вдалося перевірити статус оплати.")
  if (!body || typeof body !== "object" || typeof (body as MonobankOrderStatus).paymentStatus !== "string") {
    throw new Error("Сервер повернув некоректний статус оплати.")
  }
  return body as MonobankOrderStatus
}

export function fiscalReceiptUrl(invoiceId: string): string {
  return `/api/payments/monobank/fiscal-checks/${encodeURIComponent(invoiceId)}/pdf`
}
