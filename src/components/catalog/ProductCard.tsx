"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

import { Star } from "lucide-react"

import type { Product } from "@/types/product"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart/CartContext"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice } from "@/lib/formatters/price"
import { formatReviewsDeclension, getProductRating } from "@/lib/reviews/reviews-store"

interface ProductCardProps {
  product: Product
  priority?: boolean
}

const badgeLabels = {
  sale: "Знижка",
  hit: "Хіт сезону",
  new: "Новинка",
}

const badgeVariants: Record<keyof typeof badgeLabels, string> = {
  sale: "bg-[#8B2228] text-white border-0 shadow-xs text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5",
  hit: "bg-[#181512] text-[#FAF8F5] dark:bg-[#D4AF37] dark:text-[#0B0F0E] border-0 shadow-xs text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5",
  new: "bg-[#1B3527] text-white border-0 shadow-xs text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5",
}

export function ProductCard({
  product,
  priority = false,
}: ProductCardProps) {
  const { addItem, items } = useCart()
  const [isAdded, setIsAdded] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const rating = getProductRating(product.id)

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
    <article className="group/card relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-luxury transition-all duration-300 hover:-translate-y-1 hover:border-foreground/25 dark:hover:border-[#d4af37]/50 hover:shadow-luxury-hover">
      <Link
        href={`/product/${product.slug}`}
        className="group relative aspect-square overflow-hidden bg-muted/40"
        aria-label={`Переглянути товар: ${product.name}`}
      >
        {!isImageLoaded && (
          <div className="absolute inset-0 skeleton-shimmer z-0" aria-hidden="true" />
        )}

        <Image
          src={product.mainImageUrl}
          alt={product.name}
          fill
          loading={priority ? "eager" : "lazy"}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          onLoad={() => setIsImageLoaded(true)}
          className={`object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
            isImageLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-98 blur-[2px]"
          }`}
        />

        {/* Мягкая виньетка при наведении */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />

        {product.badge && (
          <Badge className={`absolute left-3 top-3 ${badgeVariants[product.badge] || ""}`}>
            {badgeLabels[product.badge]}
          </Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* min-h-[2.75em] = ровно 2 строки (2 × leading-snug 1.375em).
            Раньше min-h-12 был выше двух строк, и из-под line-clamp
            выглядывал верх третьей строки. */}
        <h3 className="min-h-[2.75em] line-clamp-2 break-words font-medium text-[15px] leading-snug text-foreground transition-colors group-hover/card:text-[#d4af37]">
          <Link
            href={`/product/${product.slug}`}
            className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {product.name}
          </Link>
        </h3>

        {/* Звездный рейтинг: звёзды и балл — одна группа, отзывы — другая.
            В узкой карточке «(24 відгуки)» целиком переносится на новую строку. */}
        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
          <div className="flex shrink-0 items-center gap-1.5">
            <div className="flex items-center gap-0.5 text-[#F59E0B] dark:text-[#FBBF24]" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`size-3.5 ${
                    i < Math.round(rating.score)
                      ? "fill-current text-[#F59E0B] dark:text-[#FBBF24]"
                      : "text-muted-foreground/30 fill-muted-foreground/15"
                  }`}
                />
              ))}
            </div>
            <span className="font-bold text-foreground text-xs tracking-tight">
              {rating.score.toFixed(1)}
            </span>
          </div>
          <span className="whitespace-nowrap text-[11px] text-muted-foreground">
            ({rating.count} {formatReviewsDeclension(rating.count)})
          </span>
        </div>

        <div className="mt-3 flex min-h-7 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="whitespace-nowrap text-base font-semibold tracking-tight text-foreground">
            {formattedPrice}
          </p>

          {formattedOldPrice && (
            <p className="whitespace-nowrap text-xs text-muted-foreground line-through">
              {formattedOldPrice}
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center gap-1.5 pt-3 text-xs text-muted-foreground">
          <span
            className={`size-1.5 shrink-0 rounded-full ${
              isOutOfStock ? "bg-red-400" : "bg-emerald-500/80"
            }`}
            aria-hidden="true"
          />
          <p>
            {isOutOfStock ? "Немає в наявності" : "Є в наявності"}
          </p>
        </div>

        {/* h-auto + whitespace-normal: длинный текст («Максимум у кошику»)
            переносится внутри кнопки, а не вылезает за её край. */}
        <Button
          className={`mt-3.5 h-auto min-h-8 w-full whitespace-normal rounded-full border-0 py-2 text-center text-xs font-semibold leading-tight tracking-wide uppercase transition-all duration-200 ${
            isAdded
              ? "bg-[#1B3527] text-white scale-[1.01]"
              : "bg-foreground text-background hover:bg-foreground/90 active:scale-[0.98] shadow-xs"
          }`}
          disabled={isOutOfStock || isMaxQuantityReached}
          onClick={handleAddToCart}
        >
          {isOutOfStock
            ? "Немає в наявності"
            : isMaxQuantityReached
              ? "Максимум у кошику"
              : isAdded
                ? "Додано до кошика ✓"
                : "До кошика"}
        </Button>
      </div>
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-luxury">
      <Skeleton className="aspect-square w-full rounded-none" />

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>

        <Skeleton className="mt-auto h-4 w-28" />
        <Skeleton className="mt-3 h-10 w-full rounded-full" />
      </div>
    </article>
  )
}
