"use client"

import { useEffect, useState, type FormEvent } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Package, Search, Truck, UserRound, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  fetchAdminOrder,
  fetchAdminOrders,
  orderStatuses,
  updateAdminOrderComment,
  updateAdminOrderStatus,
  type AdminOrderDetail,
  type AdminOrdersQuery,
  type OrderStatus,
  type PagedAdminOrders,
} from "@/lib/api/admin/orders"
import { formatPrice } from "@/lib/formatters/price"

interface OrdersAdminProps {
  initialPage: PagedAdminOrders
}

const statusLabels: Record<OrderStatus, string> = {
  New: "Нове",
  Confirmed: "Підтверджене",
  Packed: "Збирається",
  Shipped: "Відправлене",
  Delivered: "Доставлене",
  Cancelled: "Скасоване",
  Refused: "Відмова",
  Returned: "Повернення",
}

function statusVariant(status: OrderStatus): "secondary" | "outline" | "destructive" {
  if (status === "New" || status === "Confirmed" || status === "Packed") return "secondary"
  if (status === "Cancelled" || status === "Refused" || status === "Returned") return "destructive"
  return "outline"
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatPaymentMethod(value: string) {
  return value === "CashOnDelivery" ? "Післяплата" : value === "Online" ? "Онлайн" : value
}

function formatPaymentStatus(value: string) {
  const labels: Record<string, string> = {
    Pending: "Очікує оплати",
    Paid: "Оплачено",
    Failed: "Помилка оплати",
    Refunded: "Повернено",
  }
  return labels[value] ?? value
}

function SummaryCard({
  label,
  value,
  note,
  icon,
}: {
  label: string
  value: string | number
  note?: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  )
}

export function OrdersAdmin({ initialPage }: OrdersAdminProps) {
  const [page, setPage] = useState(initialPage)
  const [status, setStatus] = useState<OrderStatus | "">("")
  const [searchInput, setSearchInput] = useState("")
  const [query, setQuery] = useState<AdminOrdersQuery>({ pageSize: initialPage.pageSize })
  const [isLoading, setIsLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("New")
  const [statusComment, setStatusComment] = useState("")
  const [adminComment, setAdminComment] = useState("")
  const [isSavingStatus, setIsSavingStatus] = useState(false)
  const [isSavingComment, setIsSavingComment] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const orders = page.items ?? []
  const rows = orders
  const newAndProcessing = orders.filter((order) => ["New", "Confirmed", "Packed"].includes(order.orderStatus)).length
  const shipped = orders.filter((order) => order.orderStatus === "Shipped").length
  const pageRevenue = orders.reduce((total, order) => total + order.totalPrice, 0)

  async function loadOrders(nextQuery: AdminOrdersQuery) {
    setIsLoading(true)
    setListError(null)
    try {
      setPage(await fetchAdminOrders({ ...nextQuery, pageSize: initialPage.pageSize }))
      setQuery(nextQuery)
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Не вдалося завантажити замовлення")
    } finally {
      setIsLoading(false)
    }
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void loadOrders({
      status: status || undefined,
      search: searchInput.trim() || undefined,
      pageNumber: 1,
    })
  }

  function changePage(pageNumber: number) {
    void loadOrders({ ...query, pageNumber })
  }

  function openOrder(id: string) {
    setDetail(null)
    setDetailError(null)
    setActionMessage(null)
    setIsDetailLoading(true)
    setSelectedId(id)
  }

  useEffect(() => {
    if (!selectedId) return

    let active = true
    void fetchAdminOrder(selectedId)
      .then((result) => {
        if (!active) return
        setDetail(result)
        setSelectedStatus(result.orderStatus)
        setAdminComment(result.adminComment ?? "")
      })
      .catch((error: unknown) => {
        if (active) setDetailError(error instanceof Error ? error.message : "Не вдалося завантажити замовлення")
      })
      .finally(() => {
        if (active) setIsDetailLoading(false)
      })

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedId(null)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      active = false
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [selectedId])

  async function saveStatus() {
    if (!detail) return
    setIsSavingStatus(true)
    setDetailError(null)
    setActionMessage(null)
    try {
      await updateAdminOrderStatus(detail.id, {
        status: selectedStatus,
        comment: statusComment.trim() || undefined,
      })
      const refreshed = await fetchAdminOrder(detail.id)
      setDetail(refreshed)
      setSelectedStatus(refreshed.orderStatus)
      setStatusComment("")
      await loadOrders(query)
      setActionMessage("Статус замовлення оновлено.")
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Не вдалося змінити статус")
    } finally {
      setIsSavingStatus(false)
    }
  }

  async function saveAdminComment() {
    if (!detail) return
    setIsSavingComment(true)
    setDetailError(null)
    setActionMessage(null)
    try {
      const refreshed = await updateAdminOrderComment(detail.id, adminComment.trim())
      setDetail(refreshed)
      setActionMessage("Внутрішній коментар збережено.")
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Не вдалося зберегти коментар")
    } finally {
      setIsSavingComment(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Адміністрування</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Замовлення</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Переглядайте замовлення, дані доставки та історію обробки.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Усього замовлень" value={page.totalCount} icon={<ClipboardList className="size-4" />} />
        <SummaryCard label="Нові / в обробці" value={newAndProcessing} note="На поточній сторінці списку" icon={<Package className="size-4" />} />
        <SummaryCard label="Відправлені" value={shipped} note="На поточній сторінці списку" icon={<Truck className="size-4" />} />
        <SummaryCard label="Сума замовлень" value={formatPrice(pageRevenue)} note="На поточній сторінці списку" icon={<span className="text-xs font-semibold">₴</span>} />
      </div>

      <form onSubmit={applyFilters} className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[220px_minmax(0,1fr)_auto]">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus | "")}
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
          aria-label="Фільтр замовлень за статусом"
        >
          <option value="">Усі статуси</option>
          {orderStatuses.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="№ замовлення, ім’я або телефон" aria-label="Пошук замовлень" className="pl-9" />
        </div>
        <Button type="submit" disabled={isLoading}><Search />{isLoading ? "Пошук…" : "Знайти"}</Button>
      </form>

      {listError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{listError}</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ClipboardList className="mx-auto size-9 text-muted-foreground" />
            <h2 className="mt-4 font-medium">Замовлень не знайдено</h2>
            <p className="mt-2 text-sm text-muted-foreground">Змініть фільтр або пошуковий запит.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <caption className="sr-only">Список замовлень</caption>
              <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Замовлення</th>
                  <th className="px-4 py-3 font-medium">Покупець</th>
                  <th className="px-4 py-3 font-medium">Телефон</th>
                  <th className="px-4 py-3 font-medium">Доставка</th>
                  <th className="px-4 py-3 font-medium">Сума</th>
                  <th className="px-4 py-3 font-medium">Оплата</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium">Створено</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((order) => (
                  <tr key={order.id} className="cursor-pointer align-middle transition-colors hover:bg-muted/30 focus-within:bg-muted/30" onClick={() => openOrder(order.id)}>
                    <td className="px-4 py-4">
                      <button type="button" className="font-semibold hover:underline focus-visible:underline" onClick={() => openOrder(order.id)}>
                        №{order.orderNumber}
                      </button>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{order.publicId}</p>
                    </td>
                    <td className="px-4 py-4 font-medium">{order.customerFullName || "Покупець"}</td>
                    <td className="px-4 py-4 text-muted-foreground">{order.customerPhone || "—"}</td>
                    <td className="max-w-56 px-4 py-4 text-muted-foreground">{[order.deliveryCityName, order.deliveryWarehouseName].filter(Boolean).join(", ") || "—"}</td>
                    <td className="px-4 py-4 font-semibold">{formatPrice(order.totalPrice)}</td>
                    <td className="px-4 py-4 text-muted-foreground">{formatPaymentMethod(order.paymentMethod)}</td>
                    <td className="px-4 py-4"><Badge variant={statusVariant(order.orderStatus)}>{statusLabels[order.orderStatus]}</Badge></td>
                    <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
          <span className="text-muted-foreground">Сторінка {page.pageNumber} з {Math.max(page.totalPages, 1)} · {page.totalCount} замовлень</span>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" aria-label="Попередня сторінка" disabled={isLoading || page.pageNumber <= 1} onClick={() => changePage(page.pageNumber - 1)}><ChevronLeft />Назад</Button>
            <Button type="button" size="sm" variant="outline" aria-label="Наступна сторінка" disabled={isLoading || page.pageNumber >= page.totalPages} onClick={() => changePage(page.pageNumber + 1)}>Далі<ChevronRight /></Button>
          </div>
        </div>
      </div>

      {selectedId && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-foreground/50 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null) }}>
          <section className="flex max-h-[min(920px,100dvh)] w-full max-w-5xl flex-col overflow-hidden border-border bg-background shadow-2xl sm:rounded-2xl sm:border" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
            <header className="flex shrink-0 items-start justify-between border-b border-border px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">Деталі замовлення</p>
                <h2 id="order-detail-title" className="mt-1 text-xl font-semibold">{detail ? `Замовлення №${detail.orderNumber}` : "Завантаження…"}</h2>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Закрити деталі" onClick={() => setSelectedId(null)}><X /></Button>
            </header>

            {isDetailLoading ? <div className="p-8 text-center text-sm text-muted-foreground">Завантажуємо дані замовлення…</div> : detailError && !detail ? <p role="alert" className="m-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{detailError}</p> : detail && (
              <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)] lg:p-7">
                <div className="space-y-6">
                  <section>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2"><Badge variant={statusVariant(detail.orderStatus)}>{statusLabels[detail.orderStatus]}</Badge><span className="text-sm text-muted-foreground">{formatDate(detail.createdAt)}</span></div>
                      <span className="text-xl font-semibold">{formatPrice(detail.totalPrice)}</span>
                    </div>
                    <div className="mt-4 overflow-hidden rounded-xl border border-border">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Товар</th><th className="px-4 py-3 text-right font-medium">К-сть</th><th className="px-4 py-3 text-right font-medium">Ціна</th><th className="px-4 py-3 text-right font-medium">Разом</th></tr></thead>
                        <tbody className="divide-y divide-border">{(detail.items ?? []).map((item) => <tr key={`${item.productId}-${item.productName}`}><td className="px-4 py-3 font-medium">{item.productName || "Товар"}</td><td className="px-4 py-3 text-right">{item.quantity}</td><td className="px-4 py-3 text-right whitespace-nowrap">{formatPrice(item.unitPrice)}</td><td className="px-4 py-3 text-right font-medium whitespace-nowrap">{formatPrice(item.lineTotal)}</td></tr>)}</tbody>
                      </table>
                    </div>
                  </section>

                  <section className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold"><UserRound className="size-4" />Покупець</h3>
                      <p className="mt-3 text-sm">{detail.customerFullName || "—"}</p>
                      {detail.customerPhone && <a className="mt-1 block text-sm text-muted-foreground hover:underline" href={`tel:${detail.customerPhone}`}>{detail.customerPhone}</a>}
                      {detail.customerEmail && <a className="mt-1 block break-all text-sm text-muted-foreground hover:underline" href={`mailto:${detail.customerEmail}`}>{detail.customerEmail}</a>}
                      {detail.customerComment && <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">Коментар покупця: {detail.customerComment}</p>}
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold"><Truck className="size-4" />Доставка Новою Поштою</h3>
                      <p className="mt-3 text-sm">{detail.deliveryCityName || "Місто не вказано"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{detail.deliveryWarehouseName || "Відділення / поштомат не вказано"}</p>
                      {detail.deliveryCityRef && <p className="mt-2 break-all font-mono text-xs text-muted-foreground">Ref міста: {detail.deliveryCityRef}</p>}
                      {detail.deliveryWarehouseRef && <p className="mt-1 break-all font-mono text-xs text-muted-foreground">Ref точки: {detail.deliveryWarehouseRef}</p>}
                      <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">Створення або оновлення ТТН не підтримується наявними endpoint’ами API замовлень.</p>
                    </div>
                  </section>

                  <section className="rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">Оплата</h3>
                      <span className="text-sm">{formatPaymentMethod(detail.paymentMethod)} · {formatPaymentStatus(detail.paymentStatus)}</span>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold">Історія статусів</h3>
                    {(detail.statusHistory ?? []).length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Історія ще порожня.</p> : <ol className="mt-3 space-y-3 border-l border-border pl-4">{(detail.statusHistory ?? []).map((entry) => <li key={entry.id} className="relative"><span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-primary" /><p className="text-sm font-medium">{entry.oldStatus ? `${statusLabels[entry.oldStatus]} → ` : ""}{statusLabels[entry.newStatus]}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(entry.createdAt)}{entry.changedByAdminName ? ` · ${entry.changedByAdminName}` : ""}</p>{entry.comment && <p className="mt-1 text-sm text-muted-foreground">{entry.comment}</p>}</li>)}</ol>}
                  </section>
                </div>

                <aside className="space-y-5">
                  <section className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold">Змінити статус</h3>
                    <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as OrderStatus)} className="border-input bg-background mt-3 h-9 w-full rounded-lg border px-3 text-sm" aria-label="Новий статус замовлення">{orderStatuses.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}</select>
                    <textarea value={statusComment} onChange={(event) => setStatusComment(event.target.value)} rows={3} placeholder="Коментар до зміни статусу (необов’язково)" className="border-input placeholder:text-muted-foreground mt-3 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
                    <Button type="button" className="mt-3 w-full" disabled={isSavingStatus || selectedStatus === detail.orderStatus} onClick={saveStatus}>{isSavingStatus ? "Збереження…" : "Зберегти статус"}</Button>
                  </section>
                  <section className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold">Внутрішній коментар</h3>
                    <textarea value={adminComment} onChange={(event) => setAdminComment(event.target.value)} rows={5} placeholder="Нотатка для команди" className="border-input placeholder:text-muted-foreground mt-3 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
                    <Button type="button" variant="outline" className="mt-3 w-full" disabled={isSavingComment} onClick={saveAdminComment}>{isSavingComment ? "Збереження…" : "Зберегти коментар"}</Button>
                  </section>
                  {detailError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{detailError}</p>}
                  {actionMessage && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">{actionMessage}</p>}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />Оновлено {formatDate(detail.updatedAt)}</div>
                </aside>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
