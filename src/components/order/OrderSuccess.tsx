"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Check, Clipboard, CreditCard, Landmark, PackageCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getLastOrder, type LocalOrder } from "@/lib/api/orders"
import { pushPurchase } from "@/lib/analytics/data-layer"
import { formatPrice } from "@/lib/formatters/price"
import { shopConfig } from "@/lib/config/shop"

export function OrderSuccess() {
  const [order, setOrder] = useState<LocalOrder | null | undefined>(undefined)
  const [isCopied, setIsCopied] = useState(false)
  const hasReportedPurchase = useRef(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setOrder(getLastOrder()), 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (!order || hasReportedPurchase.current) return

    const reportKey = `lumiere:purchase-reported:${order.id}`
    if (window.sessionStorage.getItem(reportKey)) {
      hasReportedPurchase.current = true
      return
    }

    hasReportedPurchase.current = true
    pushPurchase(order.id, order.analyticsItems, order.total)
    window.sessionStorage.setItem(reportKey, "1")
  }, [order])

  async function copyPaymentDetails() {
    if (!order || order.paymentMethod !== "iban") return

    const details = [
      `Отримувач: ${shopConfig.payment.ibanRecipient || "Не налаштовано"}`,
      `IBAN: ${shopConfig.payment.iban || "Не налаштовано"}`,
      `Призначення: Оплата замовлення №${order.id}`,
    ].join("\n")

    try {
      await navigator.clipboard.writeText(details)
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 2200)
    } catch {
      setIsCopied(false)
    }
  }

  if (order === undefined) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center px-4 py-16 text-sm text-muted-foreground">
        Завантаження даних замовлення…
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-2xl items-center justify-center px-4 py-16 text-center">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Замовлення
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Дані замовлення не знайдені
          </h1>
          <p className="mt-4 text-muted-foreground">
            Сесія замовлення завершилася або сторінку відкрито без оформлення.
          </p>
          <Button className="mt-7" asChild>
            <Link href="/#catalog">До каталогу</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isIban = order.paymentMethod === "iban"

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-20">
      <div className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
          <Check className="size-8" aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Дякуємо за замовлення
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Замовлення прийнято
        </h1>
        <p className="mt-4 text-muted-foreground">
          Номер замовлення: <strong className="text-foreground">{order.id}</strong>
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <span className="text-muted-foreground">Сума замовлення</span>
          <strong className="text-xl">{formatPrice(order.total)}</strong>
        </div>

        <div className="mt-5 flex items-start gap-3">
          {isIban ? (
            <Landmark className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
          ) : (
            <CreditCard className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
          )}
          <div>
            <h2 className="font-semibold">
              {isIban ? "Оплата за реквізитами IBAN" : "Оплата при отриманні"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isIban
                ? "Замовлення зарезервовано. Ми почнемо комплектацію та відправку після підтвердження оплати."
                : "Замовлення буде відправлено Новою Поштою з оплатою при отриманні у вибраній точці."}
            </p>
          </div>
        </div>

        {isIban && (
          <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 sm:p-5">
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Отримувач</p>
                <p className="mt-1 font-medium">
                  {shopConfig.payment.ibanRecipient || "Реквізити ще не налаштовані"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">IBAN</p>
                <p className="mt-1 break-all font-mono font-medium">
                  {shopConfig.payment.iban || "Реквізити ще не налаштовані"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Призначення платежу</p>
                <p className="mt-1 font-medium">Оплата замовлення №{order.id}</p>
              </div>
            </div>
            <Button className="mt-5 w-full sm:w-auto" variant="outline" onClick={copyPaymentDetails}>
              {isCopied ? <Check /> : <Clipboard />}
              {isCopied ? "Скопійовано" : "Скопіювати реквізити"}
            </Button>
            {isCopied && (
              <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300" role="status">
                Реквізити скопійовано в буфер обміну.
              </p>
            )}
            {!shopConfig.payment.iban && (
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                Перед запуском оплату потрібно доповнити реальними реквізитами у налаштуваннях магазину.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border p-5 text-sm text-muted-foreground">
        <PackageCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p>
          Ми зв’яжемося з вами для підтвердження даних доставки. Доставка Новою Поштою оплачується за тарифами перевізника.
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <Button asChild>
          <Link href="/#catalog">Продовжити покупки</Link>
        </Button>
      </div>
    </div>
  )
}
