import type { Metadata } from "next"

import { AnalyticsAdmin } from "@/components/admin/analytics/AnalyticsAdmin"
import { analyticsPeriods, type AnalyticsPeriod } from "@/lib/api/admin/analytics"
import { getAnalyticsSnapshot } from "@/lib/api/admin/analytics-server"
import { getFinanceSnapshot } from "@/lib/api/admin/finance-server"

export const metadata: Metadata = {
  title: "Аналітика та фінанси — адмін-панель",
  robots: { index: false, follow: false },
}

interface AnalyticsPageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function AdminAnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams
  const period = analyticsPeriods.find((value) => value === params.period) ?? "30d" satisfies AnalyticsPeriod
  const [analytics, finance] = await Promise.all([
    getAnalyticsSnapshot(period),
    getFinanceSnapshot(),
  ])

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <AnalyticsAdmin initialPeriod={period} initialAnalytics={analytics} initialFinance={finance} />
      </div>
    </div>
  )
}
