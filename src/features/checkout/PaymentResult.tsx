"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { CheckCircle2, Clock3, FileDown, RefreshCw, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createMonobankInvoice, fiscalReceiptUrl, getMonobankOrderStatus, type MonobankOrderStatus } from "@/lib/api/monobank"
import { formatPrice } from "@/lib/formatters/price"
import { MonobankMark } from "./MonobankMark"

const MAX_CHECKS = 6
const POLL_DELAY_MS = 2500

export function PaymentResult() {
  const publicId = useSearchParams().get("publicId")
  const [status, setStatus] = useState<MonobankOrderStatus | null>(null)
  const [checking, setChecking] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!publicId) return
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined

    async function check(attempt: number) {
      try {
        const result = await getMonobankOrderStatus(publicId!, controller.signal)
        if (controller.signal.aborted) return
        setStatus(result)
        setError(null)
        if (result.paymentStatus === "Pending" && !result.isPaid && attempt < MAX_CHECKS) {
          timer = setTimeout(() => void check(attempt + 1), POLL_DELAY_MS)
        } else {
          setChecking(false)
        }
      } catch (cause) {
        if (controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : "Не вдалося перевірити статус оплати.")
        setChecking(false)
      }
    }

    void check(1)
    return () => { controller.abort(); if (timer) clearTimeout(timer) }
  }, [publicId, refreshKey])

  async function retryPayment() {
    if (!publicId) return
    setRetrying(true)
    setError(null)
    try {
      window.location.href = await createMonobankInvoice(publicId)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не вдалося перейти до оплати.")
      setRetrying(false)
    }
  }

  const isPaid = status?.paymentStatus === "Paid" || status?.isPaid === true
  const isFailed = status?.paymentStatus === "Failed" || status?.paymentStatus === "Refunded"

  return (
    <div className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/5">
      <div className="border-b border-border bg-muted/30 px-6 py-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Jingle Decor · Оплата</span>
          <MonobankMark />
        </div>
      </div>
      <div className="px-6 py-8 sm:px-8 sm:py-10">
        {!publicId ? (
          <ResultMessage icon={<XCircle className="size-9" />} title="Код замовлення відсутній" description="Відкрийте посилання на оплату з підтвердження замовлення." tone="error" />
        ) : isPaid ? (
          <ResultMessage icon={<CheckCircle2 className="size-9" />} title="Оплату отримано" description="Дякуємо! Передали ваше замовлення в обробку. Ми зв’яжемося з вами для підтвердження доставки." tone="success" />
        ) : isFailed ? (
          <ResultMessage icon={<XCircle className="size-9" />} title={status?.paymentStatus === "Refunded" ? "Оплату повернено" : "Оплату не завершено"} description="Кошти не зараховані. Якщо ви хочете завершити покупку, спробуйте оплатити ще раз." tone="error" />
        ) : error && !status ? (
          <ResultMessage icon={<XCircle className="size-9" />} title="Не вдалося перевірити оплату" description="Замовлення збережено. Спробуйте повторити перевірку пізніше." tone="error" />
        ) : (
          <ResultMessage icon={<Clock3 className="size-9" />} title={checking ? "Перевіряємо платіж" : "Очікуємо підтвердження"} description={checking ? "Очікуємо підтвердження від банку. Це може зайняти кілька секунд." : "Платіж поки не підтверджено. Перевірте його статус трохи пізніше."} tone="pending" />
        )}

        {status && (
          <dl className="mt-7 divide-y divide-border rounded-xl border border-border bg-background px-4 text-sm">
            <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Замовлення</dt><dd className="font-semibold">#{status.orderNumber}</dd></div>
            <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Сума, грн</dt><dd className="font-semibold">{formatPrice(status.totalPrice)}</dd></div>
          </dl>
        )}

        {error && <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {isPaid && status?.receiptAvailable && status.invoiceId && (
            <Button asChild className="gap-2"><a href={fiscalReceiptUrl(status.invoiceId)} target="_blank" rel="noopener noreferrer"><FileDown className="size-4" /> Завантажити фіскальний чек</a></Button>
          )}
          {!isPaid && !checking && status?.canRetryPayment && (
            <Button disabled={retrying} onClick={() => void retryPayment()}>{retrying ? "Переходимо до оплати…" : "Повторити оплату"}</Button>
          )}
          {!isPaid && !isFailed && publicId && !checking && (
            <Button variant="outline" className="gap-2" onClick={() => { setChecking(true); setError(null); setRefreshKey(value => value + 1) }}><RefreshCw className="size-4" /> Перевірити ще раз</Button>
          )}
          {!isPaid && publicId && (
            <Button variant="outline" asChild><Link href={`/order/success?publicId=${encodeURIComponent(publicId)}`}>Переглянути замовлення</Link></Button>
          )}
          <Button variant="ghost" asChild><Link href="/#catalog">До каталогу</Link></Button>
        </div>
      </div>
    </div>
  )
}

function ResultMessage({ icon, title, description, tone }: { icon: ReactNode; title: string; description: string; tone: "success" | "error" | "pending" }) {
  const toneClass = tone === "success" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : tone === "error" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
  return (
    <div className="text-center" role="status" aria-live="polite">
      <span className={`mx-auto flex size-16 items-center justify-center rounded-full ${toneClass}`}>{icon}</span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}
