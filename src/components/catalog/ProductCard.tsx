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
  hit: "Хіт сезону",
  new: "Новинка",
}

const badgeVariants: Record<keyof typeof badgeLabels, string> = {
  sale: "bg-[#8B2228]/95 text-white border-0 ring-1 ring-white/20 backdrop-blur-md shadow-sm text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5",
  hit: "bg-[#181512]/90 text-[#F3D078] dark:bg-[#D4AF37]/95 dark:text-[#0B0F0E] border-0 ring-1 ring-[#F3D078]/30 backdrop-blur-md shadow-sm text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5",
  new: "bg-[#1B3527]/95 text-[#FAF8F5] border-0 ring-1 ring-white/20 backdrop-blur-md shadow-sm text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5",
}

export function ProductCard({
  product,
  priority = false,
}: ProductCardProps) {
  const { addItem, items } = useCart()
  const [isAdded, setIsAdded] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [hasImageError, setHasImageError] = useState(false)

  const variants = product.variants && product.variants.length > 1 ? product.variants : null
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    () => variants?.find((v) => v.isCurrent)?.id ?? product.id
  )

  const activeVariant = variants?.find((v) => v.id === selectedVariantId) ?? null

  const activeId = activeVariant?.id ?? product.id
  const activeName = activeVariant?.name ?? product.name
  const activeSlug = activeVariant?.slug ?? product.slug
  const activePrice = activeVariant?.price ?? product.price
  const activeOldPrice =
    activeVariant !== null ? (activeVariant.oldPrice ?? null) : (product.oldPrice ?? null)
  const activeInStock = activeVariant !== null ? activeVariant.inStock : product.stock > 0

  const cartItem = items.find(
    (item) => item.product.id === activeId
  )

  const isOutOfStock = !activeInStock

  const isMaxQuantityReached =
    cartItem !== undefined &&
    cartItem.quantity >= (product.stock > 0 ? product.stock : 99)

  const formattedPrice = formatPrice(activePrice)

  const formattedOldPrice =
    activeOldPrice != null && activeOldPrice > activePrice
      ? formatPrice(activeOldPrice)
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

    addItem({
      ...product,
      id: activeId,
      name: activeName,
      slug: activeSlug,
      price: activePrice,
      oldPrice: activeOldPrice,
    })
    setIsAdded(true)
  }

  return (
    <article className="group/card relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-luxury transition-all duration-300 hover:-translate-y-1 hover:border-foreground/25 dark:hover:border-[#d4af37]/50 hover:shadow-luxury-hover">
      <Link
        href={`/product/${activeSlug}`}
        className="group relative aspect-[2/3] overflow-hidden bg-muted/40"
        aria-label={`Переглянути товар: ${activeName}`}
      >
        {!isImageLoaded && (
          <div className="absolute inset-0 skeleton-shimmer z-0" aria-hidden="true" />
        )}

        <Image
          key={product.mainImageUrl}
          src={hasImageError ? "/product-placeholder.svg" : (product.mainImageUrl || "/product-placeholder.svg")}
          alt={activeName}
          fill
          loading={priority ? "eager" : "lazy"}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          onLoad={() => setIsImageLoaded(true)}
          onError={() => {
            setHasImageError(true)
            setIsImageLoaded(true)
          }}
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
        {/* min-h-[2.75em] = ровно 2 строки (2 × leading-snug 1.375em). */}
        <h3 className="min-h-[2.75em] line-clamp-2 break-words font-medium text-[15px] leading-snug text-foreground transition-colors group-hover/card:text-[#8C5E14] dark:group-hover/card:text-[#F3D078]">
          <Link
            href={`/product/${activeSlug}`}
            className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {activeName}
          </Link>
        </h3>

        {/* Швидкий вибір висоти ялинки прямо на картці в каталозі */}
        {variants && (
          <div className="mt-2.5 flex flex-wrap gap-1" role="group" aria-label="Вибір висоти">
            {variants.map((v) => {
              const isSelected = v.id === activeId
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#8C5E14] dark:text-[#F3D078] font-semibold"
                      : "border-border/70 bg-muted/40 text-muted-foreground hover:border-[#D4AF37]/50 hover:text-foreground"
                  }`}
                >
                  {v.height}
                </button>
              )
            })}
          </div>
        )}

        {/* Домінантна ціна + акуратний індикатор наявності в одному рядку */}
        <div className="mt-auto pt-4 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="whitespace-nowrap text-lg sm:text-[19px] font-bold tracking-tight text-foreground">
              {formattedPrice}
            </p>

            {formattedOldPrice && (
              <p className="whitespace-nowrap text-xs text-muted-foreground line-through">
                {formattedOldPrice}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0">
            <span
              className={`size-1.5 shrink-0 rounded-full ${
                isOutOfStock ? "bg-red-400" : "bg-emerald-500/85"
              }`}
              aria-hidden="true"
            />
            <span>{isOutOfStock ? "Немає" : "В наявності"}</span>
          </div>
        </div>

        {/* Елегантна кнопка без візуального шуму: акцентна при наведенні на картку */}
        <Button
          className={`mt-3.5 h-auto min-h-9 w-full whitespace-normal rounded-full py-2 text-center text-xs font-semibold leading-tight tracking-wider uppercase transition-all duration-300 cursor-pointer ${
            isAdded
              ? "bg-[#1B3527] text-white border-transparent scale-[1.01]"
              : "bg-secondary/85 text-foreground border border-border/90 group-hover/card:bg-[#181512] group-hover/card:text-[#FAF8F5] group-hover/card:border-transparent dark:group-hover/card:bg-[#D4AF37] dark:group-hover/card:text-[#0B0F0E] active:scale-[0.98] shadow-xs"
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
      <Skeleton className="aspect-[2/3] w-full rounded-none" />

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
