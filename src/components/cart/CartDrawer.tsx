
"use client"

import Image from "next/image"
import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react"

import { useCart } from "@/components/cart/CartContext"
import { Button } from "@/components/ui/button"

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const formatPrice = (price: number) =>
  `${new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 0,
  }).format(price)} ₴`

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const {
    items,
    itemCount,
    totalPrice,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart()


  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-border bg-white text-slate-950 shadow-2xl dark:bg-slate-950 dark:text-slate-50"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-5">
          <div>
            <h2 id="cart-title" className="text-xl font-semibold">
              Кошик
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {itemCount} товарів
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Закрити кошик"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>

        {/* Содержимое корзины */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="size-9 text-muted-foreground" />
            </div>

            <h3 className="text-lg font-semibold">
              Ваш кошик поки порожній
            </h3>

            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Додайте товари з каталогу, щоб вони з’явилися тут.
            </p>

            <Button className="mt-6" onClick={onClose}>
              Перейти до покупок
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {items.map(({ product, quantity }) => (
                <article
  key={product.id}
  className="grid grid-cols-[80px_minmax(0,1fr)] gap-3 border-b border-border pb-5 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-4"
>
  {/* Изображение товара */}
  <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-lg bg-muted">
    <Image
      src={product.mainImageUrl}
      alt={product.name}
      fill
      loading="eager"
      unoptimized
      sizes="(min-width: 640px) 112px, 80px"
      className="object-cover"
    />
  </div>

  {/* Информация о товаре */}
  <div className="flex min-w-0 flex-col gap-2">
    <div className="flex min-w-0 items-start justify-between gap-2">
      <h3 className="min-w-0 text-sm font-medium sm:text-base">
        {product.name}
      </h3>

      <p className="shrink-0 text-right text-sm font-semibold">
        {formatPrice(product.price * quantity)}
      </p>
    </div>

    <p className="text-sm text-muted-foreground">
      {formatPrice(product.price)} / шт.
    </p>

    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
      <div className="flex items-center rounded-lg border border-border">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-r-none"
          aria-label={`Зменшити кількість: ${product.name}`}
          onClick={() => updateQuantity(product.id, quantity - 1)}
        >
          <Minus className="size-3.5" />
        </Button>

        <span className="min-w-8 text-center text-sm font-medium">
          {quantity}
        </span>

        <Button
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

      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-destructive"
        aria-label={`Видалити ${product.name}`}
        onClick={() => removeItem(product.id)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  </div>
</article>
              ))}
            </div>

            {/* Нижняя панель */}
            <div className="shrink-0 space-y-4 border-t border-border bg-white p-5 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Товарів у кошику
                </span>

                <span className="font-medium">
                  {itemCount}
                </span>
              </div>

              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Разом</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>

              <Button className="w-full" size="lg" disabled>
                Оформлення замовлення — скоро
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={clearCart}
              >
                Очистити кошик
              </Button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
