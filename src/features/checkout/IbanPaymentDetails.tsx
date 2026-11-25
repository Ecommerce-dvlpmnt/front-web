"use client"

import { useState } from "react"
import { Clipboard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { shopConfig } from "@/lib/config/shop"
import { formatPrice } from "@/lib/formatters/price"

interface IbanPaymentDetailsProps {
  amount: number
  orderNumber?: string
}

export function IbanPaymentDetails({ amount, orderNumber }: IbanPaymentDetailsProps) {
  const [copyMessage, setCopyMessage] = useState("")
  const { iban, ibanRecipient, ibanEdrpou, ibanPurpose } = shopConfig.payment
  const paymentPurpose = orderNumber
    ? ibanPurpose.includes("{orderNumber}")
      ? ibanPurpose.replaceAll("{orderNumber}", orderNumber)
      : `${ibanPurpose} №${orderNumber}`
    : ""
  const hasValidIban = /^UA\d{27}$/.test(iban)
  const hasPaymentDetails = hasValidIban && Boolean(ibanRecipient && ibanEdrpou)

  async function copyIban() {
    try {
      await navigator.clipboard.writeText(iban)
      setCopyMessage("IBAN скопійовано в буфер обміну.")
    } catch {
      setCopyMessage("Не вдалося скопіювати IBAN. Виділіть і скопіюйте його вручну.")
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 sm:p-5">
      <dl className="space-y-3 text-sm">
        {ibanRecipient && (
          <div>
            <dt className="text-xs text-muted-foreground">Отримувач</dt>
            <dd className="mt-1 font-medium">{ibanRecipient}</dd>
          </div>
        )}
        {ibanEdrpou && (
          <div>
            <dt className="text-xs text-muted-foreground">РНОКПП / ЄДРПОУ отримувача</dt>
            <dd className="mt-1 font-medium">{ibanEdrpou}</dd>
          </div>
        )}
        {hasValidIban && (
          <div>
            <dt className="text-xs text-muted-foreground">IBAN</dt>
            <dd className="mt-1 break-all font-mono font-medium select-all">{iban}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-muted-foreground">
            {orderNumber ? "Сума до сплати за товари" : "Попередня сума товарів"}
          </dt>
          <dd className="mt-1 font-medium">{formatPrice(amount)}</dd>
        </div>
        {orderNumber && (
          <div>
            <dt className="text-xs text-muted-foreground">Призначення платежу</dt>
            <dd className="mt-1 font-medium">{paymentPurpose}</dd>
          </div>
        )}
      </dl>
      {!orderNumber && (
        <p className="mt-3 text-sm text-muted-foreground">
          Сплачуйте після створення замовлення: остаточна сума та призначення платежу з номером замовлення з’являться на сторінці підтвердження.
        </p>
      )}
      {!hasPaymentDetails && (
        <p className="mt-3 text-sm text-muted-foreground">
          Повні реквізити для оплати уточніть у менеджера перед переказом коштів.
        </p>
      )}
      <Button className="mt-5 w-full sm:w-auto" type="button" variant="outline" disabled={!hasValidIban} onClick={copyIban}>
        <Clipboard aria-hidden="true" />
        Скопіювати IBAN
      </Button>
      <p className="mt-2 text-sm text-muted-foreground" role="status" aria-live="polite">
        {copyMessage}
      </p>
    </div>
  )
}
