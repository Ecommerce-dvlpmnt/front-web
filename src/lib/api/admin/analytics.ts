export const analyticsPeriods = ["today", "yesterday", "7d", "30d", "season"] as const
export type AnalyticsPeriod = (typeof analyticsPeriods)[number]

export interface MetricWithGrowth {
  total: number
  previousPeriod: number
  growthPercent: number
}

export interface AnalyticsSummary {
  revenue: MetricWithGrowth
  netProfit: MetricWithGrowth
  orders: {
    count: number
    previousPeriod: number
    growthPercent: number
    averageCheck: number
  }
  conversion: { paidRate: number }
}

export interface SalesChartPoint {
  date: string | null
  ordersCount: number
  revenue: number
  profit: number
}

export interface SalesChart {
  points: SalesChartPoint[] | null
}

export interface StatusBreakdownItem {
  status: string | null
  label: string | null
  count: number
  totalAmount: number
}

export interface PaymentMethodBreakdownItem {
  method: string | null
  label: string | null
  count: number
  percent: number
}

export interface OrdersBreakdown {
  byStatus: StatusBreakdownItem[] | null
  byPaymentMethod: PaymentMethodBreakdownItem[] | null
}

export interface TopProduct {
  productId: string
  name: string | null
  sku: string | null
  salesCount: number
  revenue: number
  profit: number
  currentStock: number
}

export interface LowStockProduct {
  productId: string
  name: string | null
  sku: string | null
  stock: number
  supplierName: string | null
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = body as { detail?: string; title?: string } | null
    throw new Error(error?.detail ?? error?.title ?? "Не вдалося завантажити аналітику")
  }
  return body as T
}

export function fetchAnalyticsSummary(period: AnalyticsPeriod) {
  return fetch(`/api/admin/analytics/summary?period=${encodeURIComponent(period)}`, { cache: "no-store" })
    .then((response) => parseResponse<AnalyticsSummary>(response))
}

export function fetchSalesChart(period: AnalyticsPeriod) {
  const params = new URLSearchParams({ period, interval: "day" })
  return fetch(`/api/admin/analytics/charts/sales?${params}`, { cache: "no-store" })
    .then((response) => parseResponse<SalesChart>(response))
}

export function fetchOrdersBreakdown() {
  return fetch("/api/admin/analytics/orders-breakdown", { cache: "no-store" })
    .then((response) => parseResponse<OrdersBreakdown>(response))
}

export function fetchTopProducts(limit = 5) {
  return fetch(`/api/admin/analytics/top-products?limit=${limit}`, { cache: "no-store" })
    .then((response) => parseResponse<TopProduct[]>(response))
}

export function fetchLowStock(threshold = 5) {
  return fetch(`/api/admin/analytics/low-stock?threshold=${threshold}`, { cache: "no-store" })
    .then((response) => parseResponse<LowStockProduct[]>(response))
}
