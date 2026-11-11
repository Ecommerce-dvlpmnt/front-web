import type { Metadata } from "next"

import { CheckoutForm } from "@/components/checkout/CheckoutForm"

export const metadata: Metadata = {
  title: "Оформлення замовлення — Lumière",
  description: "Оформіть гостьове замовлення з доставкою Новою Поштою.",
  robots: { index: false, follow: false },
}

export default function CheckoutPage() {
  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Lumière
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Оформлення замовлення
          </h1>
          <p className="mt-3 text-muted-foreground">
            Залиште контакти — ми зв’яжемося з вами для підтвердження деталей.
          </p>
        </div>
        <CheckoutForm />
      </div>
    </div>
  )
}
