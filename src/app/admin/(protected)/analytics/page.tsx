import type { Metadata } from "next"

import { AnalyticsAdmin } from "@/components/admin/analytics/AnalyticsAdmin"
import { analyticsPeriods, type AnalyticsPeriod } from "@/lib/api/admin/analytics"
import { getAnalyticsSnapshot } from "@/lib/api/admin/analytics-server"
import { getFinanceSnapshot } from "@/lib/api/admin/finance-server"

export const metadata: Metadata = {
  title: "Аналітика та фінанси — адмін-панель",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

interface AnalyticsPageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function AdminAnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams
  const period = analyticsPeriods.find((value) => value === params.period) ?? "30d" satisfies AnalyticsPeriod
  const [analytics, finance] = await Promise.all([
    getAnalyticsSnapshot(period).catch((error) => {
      console.error("Failed to load analytics snapshot:", error)
      return {
        summary: {
          revenue: { total: 0, previousPeriod: 0, growthPercent: 0 },
          netProfit: { total: 0, previousPeriod: 0, growthPercent: 0 },
          orders: { count: 0, previousPeriod: 0, growthPercent: 0, averageCheck: 0 },
          conversion: { paidRate: 0 },
        },
        chart: { points: [] },
        ordersBreakdown: { byStatus: [], byPaymentMethod: [] },
        topProducts: [],
        lowStock: [],
      }
    }),
    getFinanceSnapshot().catch((error) => {
      console.error("Failed to load finance snapshot:", error)
      return {
        exchangeRate: {
          currency: "USD",
          rate: 41.5,
          date: new Date().toISOString(),
          source: "NBU",
        },
        adSpends: [],
        deposits: [],
        partnersSummary: {
          financialOverview: {
            usdRate: 41.5,
            totalRevenue: 0,
            totalRevenueUsd: 0,
            totalDropCost: 0,
            totalDropCostUsd: 0,
            grossProfit: 0,
            grossProfitUsd: 0,
            adBudgetInvested: 0,
            adBudgetInvestedUsd: 0,
            adSpendActual: 0,
            adSpendActualUsd: 0,
            remainingAdBudget: 0,
            remainingAdBudgetUsd: 0,
            netProfitToDistribute: 0,
            netProfitToDistributeUsd: 0,
          },
          partners: [],
        },
      }
    }),
  ])

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <AnalyticsAdmin initialPeriod={period} initialAnalytics={analytics} initialFinance={finance} />
      </div>
    </div>
  )
}
