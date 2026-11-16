import { adminApiFetch } from "@/lib/api/admin/auth"
import type {
  AnalyticsPeriod,
  AnalyticsSummary,
  LowStockProduct,
  OrdersBreakdown,
  SalesChart,
  TopProduct,
} from "@/lib/api/admin/analytics"

export async function getAnalyticsSnapshot(period: AnalyticsPeriod) {
  const params = new URLSearchParams({ period })
  const chartParams = new URLSearchParams({ period, interval: "day" })
  const [summary, chart, ordersBreakdown, topProducts, lowStock] = await Promise.all([
    adminApiFetch<AnalyticsSummary>(`admin/analytics/summary?${params}`),
    adminApiFetch<SalesChart>(`admin/analytics/charts/sales?${chartParams}`),
    adminApiFetch<OrdersBreakdown>("admin/analytics/orders-breakdown"),
    adminApiFetch<TopProduct[]>("admin/analytics/top-products?limit=5"),
    adminApiFetch<LowStockProduct[]>("admin/analytics/low-stock?threshold=5"),
  ])

  return { summary, chart, ordersBreakdown, topProducts, lowStock }
}
