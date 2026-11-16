"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Activity, ArrowDownRight, ArrowUpRight, Banknote, Boxes, ChartNoAxesCombined, CircleDollarSign, Coins, PackageCheck, Percent, Plus, RefreshCw, Trash2, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  analyticsPeriods,
  fetchAnalyticsSummary,
  fetchSalesChart,
  type AnalyticsPeriod,
  type AnalyticsSummary,
  type SalesChart,
  type OrdersBreakdown,
  type TopProduct,
  type LowStockProduct,
} from "@/lib/api/admin/analytics"
import {
  createAdSpend,
  createDeposit,
  deleteAdSpend,
  fetchAdSpends,
  fetchCurrencyRate,
  fetchDeposits,
  fetchPartnersSummary,
  updatePartnerSettings,
  type AdSpend,
  type CurrencyRateInfo,
  type PartnerDeposit,
  type PartnersSummary,
} from "@/lib/api/admin/finance"
import { formatPrice } from "@/lib/formatters/price"

interface AnalyticsSnapshot {
  summary: AnalyticsSummary
  chart: SalesChart
  ordersBreakdown: OrdersBreakdown
  topProducts: TopProduct[]
  lowStock: LowStockProduct[]
}

interface FinanceSnapshot {
  exchangeRate: CurrencyRateInfo
  partnersSummary: PartnersSummary
  adSpends: AdSpend[]
  deposits: PartnerDeposit[]
}

interface AnalyticsAdminProps {
  initialPeriod: AnalyticsPeriod
  initialAnalytics: AnalyticsSnapshot
  initialFinance: FinanceSnapshot
}

const periods: Record<AnalyticsPeriod, string> = {
  today: "Сьогодні",
  yesterday: "Учора",
  "7d": "7 днів",
  "30d": "30 днів",
  season: "Сезон (90 днів)",
}

function money(value: number) {
  return formatPrice(value)
}

function dollars(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
}

function dateLabel(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("uk-UA", { day: "2-digit", month: "short" }).format(new Date(`${value}T00:00:00`))
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

function SectionTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

function MetricCard({
  label,
  value,
  note,
  growth,
  icon,
}: {
  label: string
  value: string | number
  note?: string
  growth?: number
  icon: ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {growth !== undefined ? (
        <p className={`mt-1 flex items-center gap-1 text-xs ${growth >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-destructive"}`}>
          {growth >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {growth.toFixed(1)}% до попереднього періоду
        </p>
      ) : note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
    </div>
  )
}

const positiveAmount = z.string().trim().refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, "Вкажіть суму більше нуля")
const optionalRate = z.string().trim().refine((value) => !value || (Number.isFinite(Number(value)) && Number(value) > 0), "Курс має бути більше нуля")
const entryFields = {
  amount: positiveAmount,
  currency: z.enum(["UAH", "USD"]),
  customExchangeRate: optionalRate,
  date: z.string(),
  note: z.string().max(1000, "Нотатка задовга"),
}
const adSpendSchema = z.object({
  ...entryFields,
  source: z.string().trim().min(1, "Вкажіть джерело витрат").max(100, "Максимум 100 символів"),
})
const depositSchema = z.object(entryFields)
type AdSpendFormValues = z.infer<typeof adSpendSchema>
type DepositFormValues = z.infer<typeof depositSchema>

const defaultEntry = {
  amount: "",
  currency: "UAH" as const,
  customExchangeRate: "",
  date: "",
  note: "",
}

function toDateTime(date: string) {
  return date ? new Date(`${date}T00:00:00.000Z`).toISOString() : null
}

function FormFieldError({ message }: { message?: string }) {
  return message ? <p role="alert" className="text-xs text-destructive">{message}</p> : null
}

function AdSpendForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const form = useForm<AdSpendFormValues>({
    resolver: zodResolver(adSpendSchema),
    defaultValues: { ...defaultEntry, source: "" },
  })
  const [error, setError] = useState<string | null>(null)

  async function submit(values: AdSpendFormValues) {
    setError(null)
    try {
      await createAdSpend({
        amount: Number(values.amount),
        currency: values.currency,
        customExchangeRate: values.customExchangeRate ? Number(values.customExchangeRate) : null,
        source: values.source.trim(),
        date: toDateTime(values.date),
        note: values.note.trim() || null,
      })
      form.reset({ ...defaultEntry, source: "" })
      await onCreated()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не вдалося додати витрати")
    }
  }

  return (
    <form className="space-y-3" onSubmit={form.handleSubmit(submit)} noValidate>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-muted-foreground">Сума<Input type="number" min="0.01" step="0.01" placeholder="0.00" {...form.register("amount")} />{FormFieldError({ message: form.formState.errors.amount?.message })}</label>
        <label className="space-y-1 text-xs text-muted-foreground">Валюта<select className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm text-foreground" {...form.register("currency")}><option value="UAH">UAH · ₴</option><option value="USD">USD · $</option></select></label>
        <label className="space-y-1 text-xs text-muted-foreground">Джерело витрат<Input placeholder="Google Ads, Meta Ads…" {...form.register("source")} />{FormFieldError({ message: form.formState.errors.source?.message })}</label>
        <label className="space-y-1 text-xs text-muted-foreground">Дата<Input type="date" {...form.register("date")} /></label>
        <label className="space-y-1 text-xs text-muted-foreground sm:col-span-2">Кастомний курс (необов’язково)<Input type="number" min="0.0001" step="0.0001" placeholder="Порожньо — курс НБУ" {...form.register("customExchangeRate")} />{FormFieldError({ message: form.formState.errors.customExchangeRate?.message })}</label>
        <label className="space-y-1 text-xs text-muted-foreground sm:col-span-2">Нотатка<textarea rows={2} className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm text-foreground" {...form.register("note")} />{FormFieldError({ message: form.formState.errors.note?.message })}</label>
      </div>
      <Button type="submit" size="sm" disabled={form.formState.isSubmitting}><Plus className="size-4" />{form.formState.isSubmitting ? "Збереження…" : "Додати витрату"}</Button>
    </form>
  )
}

function DepositForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const form = useForm<DepositFormValues>({ resolver: zodResolver(depositSchema), defaultValues: { ...defaultEntry } })
  const [error, setError] = useState<string | null>(null)

  async function submit(values: DepositFormValues) {
    setError(null)
    try {
      await createDeposit({
        amount: Number(values.amount),
        currency: values.currency,
        customExchangeRate: values.customExchangeRate ? Number(values.customExchangeRate) : null,
        date: toDateTime(values.date),
        note: values.note.trim() || null,
      })
      form.reset({ ...defaultEntry })
      await onCreated()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не вдалося внести депозит")
    }
  }

  return (
    <form className="space-y-3" onSubmit={form.handleSubmit(submit)} noValidate>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-muted-foreground">Сума<Input type="number" min="0.01" step="0.01" placeholder="0.00" {...form.register("amount")} />{FormFieldError({ message: form.formState.errors.amount?.message })}</label>
        <label className="space-y-1 text-xs text-muted-foreground">Валюта<select className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm text-foreground" {...form.register("currency")}><option value="UAH">UAH · ₴</option><option value="USD">USD · $</option></select></label>
        <label className="space-y-1 text-xs text-muted-foreground">Дата внесення<Input type="date" {...form.register("date")} /></label>
        <label className="space-y-1 text-xs text-muted-foreground">Кастомний курс (необов’язково)<Input type="number" min="0.0001" step="0.0001" placeholder="Порожньо — курс НБУ" {...form.register("customExchangeRate")} />{FormFieldError({ message: form.formState.errors.customExchangeRate?.message })}</label>
        <label className="space-y-1 text-xs text-muted-foreground sm:col-span-2">Нотатка<textarea rows={2} className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm text-foreground" {...form.register("note")} />{FormFieldError({ message: form.formState.errors.note?.message })}</label>
      </div>
      <p className="text-xs text-muted-foreground">Внесок буде записаний на поточного адміністратора.</p>
      <Button type="submit" size="sm" disabled={form.formState.isSubmitting}><Plus className="size-4" />{form.formState.isSubmitting ? "Збереження…" : "Додати внесок"}</Button>
    </form>
  )
}

function PartnerSettingsRow({ partner, onSave }: { partner: PartnersSummary["partners"] extends (infer T)[] | null ? T : never; onSave: (id: string, role: string, percent: number) => Promise<void> }) {
  const [role, setRole] = useState(partner.role ?? "")
  const [percent, setPercent] = useState(String(partner.sharePercent))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = Number(percent)
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      setError("Частка має бути від 0 до 100%")
      return
    }
    setSaving(true)
    setError(null)
    try { await onSave(partner.adminId, role, parsed) }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Не вдалося зберегти") }
    finally { setSaving(false) }
  }

  return (
    <tr className="align-top">
      <td className="px-4 py-3"><p className="font-medium">{partner.name || partner.username}</p><p className="text-xs text-muted-foreground">{partner.username}</p>{error && <p className="mt-1 text-xs text-destructive">{error}</p>}</td>
      <td className="px-4 py-3">{money(partner.investedAmount)}<p className="text-xs text-muted-foreground">{dollars(partner.investedAmountUsd)}</p></td>
      <td className="px-4 py-3">{money(partner.currentPayout)}<p className="text-xs text-muted-foreground">{dollars(partner.currentPayoutUsd)}</p></td>
      <td className="px-4 py-3">{partner.roi.toFixed(1)}%</td>
      <td className="px-4 py-3"><form onSubmit={submit} className="flex min-w-72 items-start gap-2"><div className="grid flex-1 gap-2 sm:grid-cols-2"><Input aria-label={`Роль партнера ${partner.username}`} value={role} onChange={(event) => setRole(event.target.value)} placeholder="Роль" /><Input aria-label={`Частка партнера ${partner.username}`} type="number" min="0" max="100" step="0.01" value={percent} onChange={(event) => setPercent(event.target.value)} /></div><Button size="sm" type="submit" variant="outline" disabled={saving}>{saving ? "…" : "Зберегти"}</Button></form></td>
    </tr>
  )
}

export function AnalyticsAdmin({ initialPeriod, initialAnalytics, initialFinance }: AnalyticsAdminProps) {
  const [period, setPeriod] = useState(initialPeriod)
  const [summary, setSummary] = useState(initialAnalytics.summary)
  const [chart, setChart] = useState(initialAnalytics.chart)
  const [finance, setFinance] = useState(initialFinance)
  const [isChangingPeriod, setIsChangingPeriod] = useState(false)
  const [isRefreshingFinance, setIsRefreshingFinance] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [financeMessage, setFinanceMessage] = useState<string | null>(null)

  const points = chart.points ?? []
  const maxChartValue = Math.max(1, ...points.map((point) => Math.max(point.revenue, point.profit)))
  const overview = finance.partnersSummary.financialOverview
  const partners = finance.partnersSummary.partners ?? []

  async function changePeriod(nextPeriod: AnalyticsPeriod) {
    setPeriod(nextPeriod)
    setIsChangingPeriod(true)
    setPageError(null)
    try {
      const [nextSummary, nextChart] = await Promise.all([
        fetchAnalyticsSummary(nextPeriod),
        fetchSalesChart(nextPeriod),
      ])
      setSummary(nextSummary)
      setChart(nextChart)
      const url = new URL(window.location.href)
      url.searchParams.set("period", nextPeriod)
      window.history.replaceState(null, "", url)
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Не вдалося оновити період")
    } finally {
      setIsChangingPeriod(false)
    }
  }

  async function refreshFinance() {
    setIsRefreshingFinance(true)
    setFinanceMessage(null)
    try {
      const [exchangeRate, partnersSummary, adSpends, deposits] = await Promise.all([
        fetchCurrencyRate(), fetchPartnersSummary(), fetchAdSpends(), fetchDeposits(),
      ])
      setFinance({ exchangeRate, partnersSummary, adSpends, deposits })
      setFinanceMessage("Фінансові дані оновлено.")
    } catch (error) {
      setFinanceMessage(error instanceof Error ? error.message : "Не вдалося оновити фінансові дані")
    } finally {
      setIsRefreshingFinance(false)
    }
  }

  async function handleDeleteSpend(id: string, source: string | null) {
    if (!window.confirm(`Видалити запис витрат${source ? ` «${source}»` : ""}?`)) return
    setFinanceMessage(null)
    try {
      await deleteAdSpend(id)
      await refreshFinance()
      setFinanceMessage("Запис витрат видалено.")
    } catch (error) {
      setFinanceMessage(error instanceof Error ? error.message : "Не вдалося видалити запис")
    }
  }

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Адміністрування</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Аналітика та фінанси</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Показники замовлень, маркетингові витрати та розподіл партнерських часток за даними backend.</p>
        </div>
        <label className="space-y-1 text-xs text-muted-foreground">Період аналітики
          <select value={period} disabled={isChangingPeriod} onChange={(event) => void changePeriod(event.target.value as AnalyticsPeriod)} className="border-input bg-background block h-10 min-w-48 rounded-lg border px-3 text-sm text-foreground">
            {analyticsPeriods.map((value) => <option key={value} value={value}>{periods[value]}</option>)}
          </select>
        </label>
      </section>

      {pageError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{pageError}</p>}

      <section className="space-y-4">
        <SectionTitle title="Ключові показники" description={`Поточний і попередній періоди · ${periods[period]}`} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Виручка" value={money(summary.revenue.total)} growth={summary.revenue.growthPercent} icon={<Banknote className="size-4" />} />
          <MetricCard label="Чистий прибуток" value={money(summary.netProfit.total)} growth={summary.netProfit.growthPercent} icon={<TrendingUp className="size-4" />} />
          <MetricCard label="Замовлення" value={summary.orders.count} note={`${summary.orders.growthPercent >= 0 ? "+" : ""}${summary.orders.growthPercent.toFixed(1)}% до попереднього періоду`} icon={<PackageCheck className="size-4" />} />
          <MetricCard label="Середній чек" value={money(summary.orders.averageCheck)} note={`Оплачено: ${summary.conversion.paidRate.toFixed(1)}%`} icon={<CircleDollarSign className="size-4" />} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Динаміка продажів" description="Поля виручки, прибутку та кількості замовлень із SalesChartResponse." />
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          {isChangingPeriod ? <p className="py-16 text-center text-sm text-muted-foreground">Оновлення графіка…</p> : points.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">За цей період даних немає.</p> : (
            <div className="overflow-x-auto" role="img" aria-label="Стовпчастий графік виручки та прибутку за днями">
              <div className="flex min-w-[700px] items-end gap-2 border-b border-border pb-3" style={{ height: 260 }}>
                {points.map((point) => {
                  const revenueHeight = Math.max(point.revenue > 0 ? 4 : 0, (point.revenue / maxChartValue) * 200)
                  const profitHeight = Math.max(point.profit > 0 ? 4 : 0, (point.profit / maxChartValue) * 200)
                  return <div key={point.date} className="flex h-full min-w-8 flex-1 flex-col justify-end">
                    <div className="flex h-[205px] items-end justify-center gap-1">
                      <div className="min-w-1.5 flex-1 rounded-t bg-primary/85" style={{ height: `${revenueHeight}px` }} title={`Виручка ${money(point.revenue)}`} />
                      <div className="min-w-1.5 flex-1 rounded-t bg-emerald-500/80" style={{ height: `${profitHeight}px` }} title={`Прибуток ${money(point.profit)}`} />
                    </div>
                    <span className="mt-2 truncate text-center text-[10px] text-muted-foreground">{dateLabel(point.date)}</span>
                  </div>
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-5 text-xs text-muted-foreground"><span className="flex items-center gap-2"><i className="size-2.5 rounded-sm bg-primary/85" />Виручка</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-sm bg-emerald-500/80" />Прибуток</span><span className="ml-auto">Замовлень за період: {points.reduce((total, point) => total + point.ordersCount, 0)}</span></div>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <SectionTitle title="Замовлення за статусами" description="Кількість і сума з OrdersBreakdownResponse." />
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[480px] text-left text-sm"><thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Статус</th><th className="px-4 py-3 text-right font-medium">Кількість</th><th className="px-4 py-3 text-right font-medium">Сума</th></tr></thead><tbody className="divide-y divide-border">{(initialAnalytics.ordersBreakdown.byStatus ?? []).map((item) => <tr key={item.status}><td className="px-4 py-3">{item.label || item.status}</td><td className="px-4 py-3 text-right">{item.count}</td><td className="px-4 py-3 text-right">{money(item.totalAmount)}</td></tr>)}</tbody></table>
          </div>
          <div className="flex flex-wrap gap-2">{(initialAnalytics.ordersBreakdown.byPaymentMethod ?? []).map((item) => <Badge key={item.method} variant="outline">{item.label || item.method}: {item.count} · {item.percent.toFixed(1)}%</Badge>)}</div>
        </div>
        <div className="space-y-4">
          <SectionTitle title="Топ товарів" description="Рейтинг за продажами, виручкою та прибутком." />
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Товар</th><th className="px-4 py-3 text-right font-medium">Продажі</th><th className="px-4 py-3 text-right font-medium">Виручка</th><th className="px-4 py-3 text-right font-medium">Прибуток</th><th className="px-4 py-3 text-right font-medium">Залишок</th></tr></thead><tbody className="divide-y divide-border">{initialAnalytics.topProducts.map((item) => <tr key={item.productId}><td className="px-4 py-3"><p className="font-medium">{item.name || "—"}</p><p className="text-xs text-muted-foreground">{item.sku}</p></td><td className="px-4 py-3 text-right">{item.salesCount}</td><td className="px-4 py-3 text-right">{money(item.revenue)}</td><td className="px-4 py-3 text-right">{money(item.profit)}</td><td className="px-4 py-3 text-right">{item.currentStock}</td></tr>)}</tbody></table>
            {initialAnalytics.topProducts.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">Поки немає продажів.</p>}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Фінансовий стан партнерів" description="Усі значення нижче повертає PartnersSummaryResponse; валюта відображена окремо." action={<Button variant="outline" size="sm" disabled={isRefreshingFinance} onClick={() => void refreshFinance()}><RefreshCw className={`size-4 ${isRefreshingFinance ? "animate-spin" : ""}`} />Оновити дані</Button>} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Виручка за весь час" value={money(overview.totalRevenue)} note={dollars(overview.totalRevenueUsd)} icon={<Banknote className="size-4" />} />
          <MetricCard label="Собівартість / дроп-ціна" value={money(overview.totalDropCost)} note={dollars(overview.totalDropCostUsd)} icon={<Boxes className="size-4" />} />
          <MetricCard label="Валовий прибуток" value={money(overview.grossProfit)} note={dollars(overview.grossProfitUsd)} icon={<ChartNoAxesCombined className="size-4" />} />
          <MetricCard label="Рекламні витрати" value={money(overview.adSpendActual)} note={dollars(overview.adSpendActualUsd)} icon={<Activity className="size-4" />} />
          <MetricCard label="Рекламний бюджет" value={money(overview.adBudgetInvested)} note={dollars(overview.adBudgetInvestedUsd)} icon={<Coins className="size-4" />} />
          <MetricCard label="Залишок бюджету" value={money(overview.remainingAdBudget)} note={dollars(overview.remainingAdBudgetUsd)} icon={<CircleDollarSign className="size-4" />} />
          <MetricCard label="Чистий прибуток до розподілу" value={money(overview.netProfitToDistribute)} note={dollars(overview.netProfitToDistributeUsd)} icon={<TrendingUp className="size-4" />} />
          <MetricCard label={`Курс ${finance.exchangeRate.currency ?? "USD"}`} value={finance.exchangeRate.rate.toFixed(4)} note={`${finance.exchangeRate.source ?? "Курс НБУ"} · ${dateTime(finance.exchangeRate.date)}`} icon={<Percent className="size-4" />} />
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Партнер</th><th className="px-4 py-3 font-medium">Інвестовано</th><th className="px-4 py-3 font-medium">Поточна виплата</th><th className="px-4 py-3 font-medium">ROI</th><th className="px-4 py-3 font-medium">Роль / частка</th></tr></thead><tbody className="divide-y divide-border">{partners.map((partner) => <PartnerSettingsRow key={partner.adminId} partner={partner} onSave={async (id, role, fixedSharePercent) => { await updatePartnerSettings(id, { role: role || null, fixedSharePercent }); await refreshFinance() }} />)}</tbody></table>
          {partners.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">Даних партнерів немає.</p>}
        </div>
      </section>

      {financeMessage && <p role="status" className="rounded-lg border border-border bg-card px-4 py-3 text-sm">{financeMessage}</p>}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <SectionTitle title="Додати рекламні витрати" description="Backend фіксує курс на дату операції; можна передати кастомний курс." />
          <AdSpendForm onCreated={refreshFinance} />
        </div>
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <SectionTitle title="Внести депозит партнера" description="Якщо AdminId не заданий, backend зараховує внесок поточному адміністратору." />
          <DepositForm onCreated={refreshFinance} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <SectionTitle title="Витрати на рекламу" description="Журнал AdSpendResponse. Запис можна видалити через наявний endpoint." />
          <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Дата / джерело</th><th className="px-4 py-3 text-right font-medium">Сума</th><th className="px-4 py-3 text-right font-medium">Курс</th><th className="px-4 py-3 font-medium">Додав</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-border">{finance.adSpends.map((item) => <tr key={item.id}><td className="px-4 py-3"><p className="font-medium">{item.source || "—"}</p><p className="text-xs text-muted-foreground">{dateTime(item.date)}{item.note ? ` · ${item.note}` : ""}</p></td><td className="px-4 py-3 text-right">{money(item.amount)}<p className="text-xs text-muted-foreground">{dollars(item.amountUsd)}</p></td><td className="px-4 py-3 text-right">{item.exchangeRate.toFixed(4)}</td><td className="px-4 py-3 text-muted-foreground">{item.recordedByAdminName || "—"}</td><td className="px-4 py-3 text-right"><Button variant="ghost" size="icon" aria-label={`Видалити витрату ${item.source || ""}`} onClick={() => void handleDeleteSpend(item.id, item.source)}><Trash2 className="size-4" /></Button></td></tr>)}</tbody></table>{finance.adSpends.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">Витрат поки немає.</p>}</div>
        </div>
        <div className="space-y-4">
          <SectionTitle title="Внески партнерів" description="Історія депозитів з UAH/USD сумами та зафіксованим курсом." />
          <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Дата / партнер</th><th className="px-4 py-3 text-right font-medium">Сума UAH</th><th className="px-4 py-3 text-right font-medium">Сума USD</th><th className="px-4 py-3 text-right font-medium">Курс</th></tr></thead><tbody className="divide-y divide-border">{finance.deposits.map((item) => <tr key={item.id}><td className="px-4 py-3"><p className="font-medium">{item.adminName || item.adminUsername}</p><p className="text-xs text-muted-foreground">{dateTime(item.date)}{item.note ? ` · ${item.note}` : ""}</p></td><td className="px-4 py-3 text-right">{money(item.amount)}</td><td className="px-4 py-3 text-right">{dollars(item.amountUsd)}</td><td className="px-4 py-3 text-right">{item.exchangeRate.toFixed(4)}</td></tr>)}</tbody></table>{finance.deposits.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">Внесків поки немає.</p>}</div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Мало на складі" description="Активні товари на рівні або нижче порога 5 шт." />
        <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Товар</th><th className="px-4 py-3 font-medium">Постачальник</th><th className="px-4 py-3 text-right font-medium">Залишок</th></tr></thead><tbody className="divide-y divide-border">{initialAnalytics.lowStock.map((item) => <tr key={item.productId}><td className="px-4 py-3"><p className="font-medium">{item.name || "—"}</p><p className="text-xs text-muted-foreground">{item.sku}</p></td><td className="px-4 py-3 text-muted-foreground">{item.supplierName || "—"}</td><td className="px-4 py-3 text-right"><Badge variant={item.stock === 0 ? "destructive" : "outline"}>{item.stock}</Badge></td></tr>)}</tbody></table>{initialAnalytics.lowStock.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">Критичних залишків немає.</p>}</div>
      </section>
    </div>
  )
}
