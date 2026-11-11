
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

import type { Product } from "@/types/product"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart/CartContext"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice } from "@/lib/formatters/price"

interface ProductCardProps {
  product: Product
  priority?: boolean
}

const badgeLabels = {
  sale: "Знижка",
  hit: "Хіт",
  new: "Новинка",
}

export function ProductCard({
  product,
  priority = false,
}: ProductCardProps) {
  const { addItem, items } = useCart()
  const [isAdded, setIsAdded] = useState(false)

  const cartItem = items.find(
    (item) => item.product.id === product.id
  )

  const isOutOfStock = product.stock <= 0

  const isMaxQuantityReached =
    cartItem !== undefined &&
    cartItem.quantity >= product.stock

  const formattedPrice = formatPrice(product.price)

  const formattedOldPrice =
    product.oldPrice != null
      ? formatPrice(product.oldPrice)
      : null

  useEffect(() => {
    if (!isAdded) return

    const timeout = window.setTimeout(() => {
      setIsAdded(false)
    }, 900)

    return () => window.clearTimeout(timeout)
  }, [isAdded])

  function handleAddToCart() {
    if (isOutOfStock || isMaxQuantityReached) return

    addItem(product)
    setIsAdded(true)
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground">
      <Link
        href={`/product/${product.slug}`}
        className="group relative aspect-square overflow-hidden bg-muted"
        aria-label={`Переглянути товар: ${product.name}`}
      >
        <Image
          src={product.mainImageUrl}
          alt={product.name}
          fill
          loading={priority ? "eager" : "lazy"}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {product.badge && (
          <Badge className="absolute left-3 top-3">
            {badgeLabels[product.badge]}
          </Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="min-h-12 line-clamp-2 font-medium">
          <Link
            href={`/product/${product.slug}`}
            className="rounded-sm outline-none transition-colors hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-3 flex min-h-7 flex-wrap items-center gap-2">
          <p className="font-semibold">
            {formattedPrice}
          </p>

          {formattedOldPrice && (
            <p className="text-sm text-muted-foreground line-through">
              {formattedOldPrice}
            </p>
          )}
        </div>

        <p className="mt-auto min-h-5 pt-3 text-sm text-muted-foreground">
          {isOutOfStock
            ? "Немає в наявності"
            : "Є в наявності"}
        </p>

        <Button
          className={`mt-3 w-full transition-transform duration-200 ${
            isAdded ? "scale-[1.02]" : "active:scale-[0.98]"
          }`}
          disabled={isOutOfStock || isMaxQuantityReached}
          onClick={handleAddToCart}
        >
          {isOutOfStock
            ? "Немає в наявності"
            : isMaxQuantityReached
              ? "Максимальна кількість у кошику"
              : isAdded
                ? "Додано ✓"
                : "Додати до кошика"}
        </Button>
      </div>
    </article>
  )
}


export function ProductCardSkeleton() {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* Заглушка изображения */}
      <Skeleton className="aspect-square w-full rounded-none" />

      {/* Заглушки информации */}
      <div className="flex flex-1 flex-col p-4">
        {/* Название товара */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Цена */}
        <div className="mt-3 flex items-center gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>

        {/* Наличие */}
        <Skeleton className="mt-auto h-4 w-28" />

        {/* Кнопка */}
        <Skeleton className="mt-3 h-10 w-full rounded-md" />
      </div>
    </article>
  )
}
