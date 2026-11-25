import type { Metadata } from "next"
import { Suspense } from "react"

import { PaymentResult } from "@/features/checkout/PaymentResult"

export const metadata: Metadata = {
  title: "Статус оплати — Jingle Decor",
  robots: { index: false, follow: false },
}

export default function PaymentResultPage() {
  return (
    <div className="min-h-full bg-background px-4 py-12 sm:px-6 lg:py-20">
      <Suspense fallback={<div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">Перевіряємо оплату…</div>}>
        <PaymentResult />
      </Suspense>
    </div>
  )
}
