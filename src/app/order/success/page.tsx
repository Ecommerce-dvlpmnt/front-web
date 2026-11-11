import type { Metadata } from "next"

import { OrderSuccess } from "@/components/order/OrderSuccess"

export const metadata: Metadata = {
  title: "Замовлення прийнято — Lumière",
  robots: { index: false, follow: false },
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-full bg-background">
      <OrderSuccess />
    </div>
  )
}
