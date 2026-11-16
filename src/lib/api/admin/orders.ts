export const orderStatuses = [
  "New",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Refused",
  "Returned",
] as const

export type OrderStatus = (typeof orderStatuses)[number]

export interface AdminOrderItem {
  productId: string
  productName: string | null
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface AdminOrder {
  id: string
  orderNumber: number
  publicId: string | null
  customerFirstName: string | null
  customerLastName: string | null
  customerFullName: string | null
  customerPhone: string | null
  customerEmail: string | null
  customerComment: string | null
  deliveryCityName: string | null
  deliveryWarehouseName: string | null
  orderStatus: OrderStatus
  paymentMethod: string
  paymentStatus: string
  totalPrice: number
  createdAt: string
  items: AdminOrderItem[] | null
}

export interface AdminOrderDetail extends AdminOrder {
  deliveryCityRef: string | null
  deliveryWarehouseRef: string | null
  totalProfit: number
  adminComment: string | null
  updatedAt: string
  items: AdminOrderDetailItem[] | null
  statusHistory: OrderStatusHistory[] | null
}

export interface AdminOrderDetailItem extends AdminOrderItem {
  unitDropPrice: number
  lineProfit: number
}

export interface OrderStatusHistory {
  id: string
  oldStatus: OrderStatus | null
  newStatus: OrderStatus
  changedByAdminId: string | null
  changedByAdminName: string | null
  comment: string | null
  createdAt: string
}

export interface PagedAdminOrders {
  items: AdminOrder[] | null
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

export interface AdminOrdersQuery {
  status?: OrderStatus
  search?: string
  from?: string
  to?: string
  pageNumber?: number
  pageSize?: number
}

export interface OrderStatusUpdate {
  status: OrderStatus
  comment?: string | null
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = payload as { detail?: string; title?: string } | null
    throw new Error(error?.detail ?? error?.title ?? "Не вдалося виконати запит")
  }
  return payload as T
}

export async function fetchAdminOrders(
  query: AdminOrdersQuery = {},
): Promise<PagedAdminOrders> {
  const params = new URLSearchParams()
  if (query.status) params.set("status", query.status)
  if (query.search?.trim()) params.set("search", query.search.trim())
  if (query.from) params.set("from", query.from)
  if (query.to) params.set("to", query.to)
  if (query.pageNumber) params.set("pageNumber", String(query.pageNumber))
  if (query.pageSize) params.set("pageSize", String(query.pageSize))

  return parseResponse<PagedAdminOrders>(
    await fetch(`/api/admin/orders?${params.toString()}`, { cache: "no-store" }),
  )
}

export async function fetchAdminOrder(id: string): Promise<AdminOrderDetail> {
  return parseResponse<AdminOrderDetail>(
    await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, { cache: "no-store" }),
  )
}

export async function updateAdminOrderStatus(
  id: string,
  input: OrderStatusUpdate,
): Promise<AdminOrder> {
  return parseResponse<AdminOrder>(
    await fetch(`/api/admin/orders/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  )
}

export async function updateAdminOrderComment(
  id: string,
  comment: string | null,
): Promise<AdminOrderDetail> {
  return parseResponse<AdminOrderDetail>(
    await fetch(`/api/admin/orders/${encodeURIComponent(id)}/comment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    }),
  )
}
