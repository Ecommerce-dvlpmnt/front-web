"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef } from "react"
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"

import { useCart } from "@/components/cart/CartContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { pushViewCart } from "@/lib/analytics/data-layer"
import { formatPrice } from "@/lib/formatters/price"

export function CartPage() {
  const {
    items,
    isHydrated,
    itemCount,
    totalPrice,
    updateQuantity,
    removeItem,
  } = useCart()
  const hasReportedView = useRef(false)

  useEffect(() => {
    if (!isHydrated || hasReportedView.current) return

    hasReportedView.current = true

    if (items.length > 0) {
      pushViewCart(items, totalPrice)
    }
  }, [isHydrated, items, totalPrice])

  if (!isHydrated) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-7xl items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">Завантаження кошика…</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-2xl items-center justify-center px-4 py-16 text-center sm:px-6">
        <div>
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="size-7 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="mt-6 text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Кошик
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            У кошику поки порожньо
          </h1>
          <p className="mt-4 text-muted-foreground">
            Додайте товари з каталогу — ми збережемо їх навіть після оновлення сторінки.
          </p>
          <Button className="mt-7" asChild>
            <Link href="/#catalog">До каталогу</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Ваш вибір
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Кошик
          </h1>
        </div>
        <Badge variant="outline">{itemCount} товарів</Badge>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.38fr)]">
        <section className="space-y-4" aria-label="Товари в кошику">
          {items.map(({ product, quantity }) => (
            <article
              key={product.id}
              className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                <Image
                  src={product.mainImageUrl}
                  alt={product.name}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0">
                <h2 className="line-clamp-2 font-medium">
                  <Link
                    href={`/product/${product.slug}`}
                    className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {product.name}
                  </Link>
                </h2>
                {product.sku && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    SKU: {product.sku}
                  </p>
                )}
                <p className="mt-3 font-semibold">{formatPrice(product.price)}</p>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 items-center rounded-lg border border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-r-none"
                      aria-label={`Зменшити кількість: ${product.name}`}
                      disabled={quantity <= 1}
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <input
                      type="number"
                      min={1}
                      max={product.stock}
                      value={quantity}
                      aria-label={`Кількість: ${product.name}`}
                      className="h-9 w-12 border-x border-border bg-transparent text-center text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      onChange={(event) => {
                        const nextQuantity = Number(event.target.value)
                        if (Number.isFinite(nextQuantity)) {
                          updateQuantity(product.id, nextQuantity)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-l-none"
                      aria-label={`Збільшити кількість: ${product.name}`}
                      disabled={quantity >= product.stock}
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    максимум {product.stock}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <p className="font-semibold">{formatPrice(product.price * quantity)}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeItem(product.id)}
                >
                  <Trash2 />
                  Видалити
                </Button>
              </div>
            </article>
          ))}
        </section>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-28">
          <h2 className="text-lg font-semibold">Підсумок</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Товари</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Доставка</span>
              <span>За тарифами Нової Пошти</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4 text-base font-semibold">
              <span>Разом</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
          </div>
          <Button className="mt-6 w-full" size="lg" asChild>
            <Link href="/checkout">Перейти до оформлення</Link>
          </Button>
          <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
            Остаточна сума товарів фіксується у формі замовлення.
          </p>
        </aside>
      </div>
    </div>
  )
}
