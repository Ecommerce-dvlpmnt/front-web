import { adminApiFetch } from "@/lib/api/admin/auth"
import type {
  AdminOrderDetail,
  AdminOrdersQuery,
  OrderStatusUpdate,
  PagedAdminOrders,
} from "@/lib/api/admin/orders"

export async function getAdminOrders(query: AdminOrdersQuery = {}) {
  const params = new URLSearchParams()
  if (query.status) params.set("Status", query.status)
  if (query.search?.trim()) params.set("Search", query.search.trim())
  if (query.from) params.set("From", query.from)
  if (query.to) params.set("To", query.to)
  params.set("PageNumber", String(query.pageNumber ?? 1))
  params.set("PageSize", String(query.pageSize ?? 50))
  return adminApiFetch<PagedAdminOrders>(`admin/orders?${params.toString()}`)
}

export async function getAdminOrder(id: string) {
  return adminApiFetch<AdminOrderDetail>(`admin/orders/${encodeURIComponent(id)}`)
}

export async function setAdminOrderStatus(id: string, input: OrderStatusUpdate) {
  return adminApiFetch<unknown>(`admin/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
}

export async function setAdminOrderComment(id: string, comment: string | null) {
  return adminApiFetch<AdminOrderDetail>(`admin/orders/${encodeURIComponent(id)}/comment`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  })
}
