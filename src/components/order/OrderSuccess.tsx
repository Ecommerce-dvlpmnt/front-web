"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowRight, Check, CreditCard, Landmark, PackageCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getLastOrder, getOrderByPublicId, type BackendOrder, type LocalOrder } from "@/lib/api/orders"
import { pushPurchase } from "@/lib/analytics/data-layer"
import { formatPrice } from "@/lib/formatters/price"
import { IbanPaymentDetails } from "@/features/checkout/IbanPaymentDetails"
import { shopConfig } from "@/lib/config/shop"
import { getMonobankOrderStatus } from "@/lib/api/monobank"

export function OrderSuccess() {
  const [order, setOrder] = useState<(BackendOrder | LocalOrder) | null | undefined>(undefined)
  const [detectedMonobank, setDetectedMonobank] = useState(false)
  const hasReportedPurchase = useRef(false)

  useEffect(() => {
    let active = true
    const publicId = new URLSearchParams(window.location.search).get("publicId")
    if (!publicId) {
      Promise.resolve().then(() => { if (active) setOrder(getLastOrder()) })
      return () => { active = false }
    }
    getOrderByPublicId(publicId)
      .then(result => { if (active) setOrder(result) })
      .catch(() => { if (active) setOrder(getLastOrder(publicId)) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!order || hasReportedPurchase.current) return

    hasReportedPurchase.current = true
    const analyticsItems = getLastOrder(order.publicId)?.analyticsItems ??
      ("analyticsItems" in order ? order.analyticsItems : order.items.map(item => ({
        item_id: item.productId,
        item_name: item.productName,
        price: item.unitPrice,
        quantity: item.quantity,
      })))
    pushPurchase(
      order.publicId,
      "orderNumber" in order ? order.orderNumber : Number(order.id),
      analyticsItems,
      "totalPrice" in order ? order.totalPrice : order.total
    )
  }, [order])

  useEffect(() => {
    if (!order || order.paymentMethod !== "Online" || !shopConfig.payment.monobankEnabled) return
    if (getLastOrder(order.publicId)?.paymentMethod === "Monobank") return
    const controller = new AbortController()
    getMonobankOrderStatus(order.publicId, controller.signal)
      .then(() => { if (!controller.signal.aborted) setDetectedMonobank(true) })
      .catch(() => { /* IBAN orders have no Monobank invoice. */ })
    return () => controller.abort()
  }, [order])

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
          <Button
            className="mt-7 group h-11 rounded-full px-7 text-sm font-semibold tracking-wide transition-all duration-200 shadow-sm cursor-pointer border-0 bg-foreground text-background hover:bg-foreground/90 dark:bg-gradient-to-r dark:from-[#E5C158] dark:via-[#F3D078] dark:to-[#D4AF37] dark:text-[#14110C] dark:shadow-[0_4px_20px_-4px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98]"
            asChild
          >
            <Link href="/#catalog" className="inline-flex items-center gap-2">
              <span>До каталогу</span>
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const isMonobank = getLastOrder(order.publicId)?.paymentMethod === "Monobank" || detectedMonobank
  const isIban = isOnlinePayment(order) && !isMonobank

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
          Номер замовлення: <strong className="text-foreground">{orderNumber(order)}</strong>
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <span className="text-muted-foreground">Сума замовлення</span>
          <strong className="text-xl">{formatPrice("totalPrice" in order ? order.totalPrice : order.total)}</strong>
        </div>

        <div className="mt-5 flex items-start gap-3">
          {isIban ? (
            <Landmark className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
          ) : (
            <CreditCard className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
          )}
          <div>
            <h2 className="font-semibold">
              {isMonobank ? "Оплата карткою онлайн" : isIban ? "Оплата за реквізитами IBAN" : "Оплата при отриманні"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isMonobank
                ? "Перевірте статус платежу або перейдіть до оплати замовлення."
                : isIban
                ? "Замовлення зарезервовано. Ми почнемо комплектацію та відправку після підтвердження оплати."
                : "Замовлення буде відправлено Новою Поштою з оплатою при отриманні у вибраній точці."}
            </p>
          </div>
        </div>

        {isIban && (
          <IbanPaymentDetails
            amount={"totalPrice" in order ? order.totalPrice : order.total}
            orderNumber={orderNumber(order)}
          />
        )}
        {isMonobank && (
          <Button asChild className="mt-5">
            <Link href={`/payment-result?publicId=${encodeURIComponent(order.publicId)}`}>
              {"paymentStatus" in order && order.paymentStatus === "Paid" ? "Переглянути оплату" : "Перейти до оплати / перевірити статус"}
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border p-5 text-sm text-muted-foreground">
        <PackageCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p>
          Ми зв’яжемося з вами для підтвердження даних доставки. Доставка Новою Поштою оплачується за тарифами перевізника.
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          asChild
          size="lg"
          className="group h-11 rounded-full px-7 text-sm font-semibold tracking-wide transition-all duration-200 shadow-sm cursor-pointer border-0 bg-foreground text-background hover:bg-foreground/90 dark:bg-gradient-to-r dark:from-[#E5C158] dark:via-[#F3D078] dark:to-[#D4AF37] dark:text-[#14110C] dark:shadow-[0_4px_20px_-4px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <Link href="/#catalog" className="inline-flex items-center gap-2">
            <span>Продовжити покупки</span>
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function isOnlinePayment(order: BackendOrder | LocalOrder) {
  return order.paymentMethod === "Online"
}

function orderNumber(order: BackendOrder | LocalOrder) {
  return "orderNumber" in order ? String(order.orderNumber) : order.id
}
