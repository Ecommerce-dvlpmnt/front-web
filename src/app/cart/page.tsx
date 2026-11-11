import type { Metadata } from "next"

import { CartPage } from "@/components/cart/CartPage"

export const metadata: Metadata = {
  title: "Кошик — Lumière",
  description: "Перевірте товари та перейдіть до оформлення замовлення.",
  robots: { index: false, follow: false },
}

export default function CartRoute() {
  return (
    <div className="min-h-full bg-background">
      <CartPage />
    </div>
  )
}
