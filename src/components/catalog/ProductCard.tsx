"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"

import type { Product } from "@/types/product"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart/CartContext"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice } from "@/lib/formatters/price"
import { getTreeHeightModel, type ProductHeightVariant } from "@/features/product/height-variants"
import { loadProductHeightVariants } from "@/lib/api/product-height-variants-client"

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
  product: initialProduct,
  priority = false,
}: ProductCardProps) {
  const { addItem, items } = useCart()
  const [heightVariants, setHeightVariants] = useState<ProductHeightVariant[] | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState(initialProduct.id)
  const [isLoadingVariants, setIsLoadingVariants] = useState(false)
  const [variantsError, setVariantsError] = useState(false)
  const variantsRequest = useRef(false)
  const focusHeightOptions = useRef(false)
  const heightModel = getTreeHeightModel(initialProduct.name)
  const product = heightVariants?.find((variant) => variant.id === selectedVariantId) ?? initialProduct
  const [isAdded, setIsAdded] = useState(false)
  const [loadedImageUrl, setLoadedImageUrl] = useState("")
  const [failedImageUrl, setFailedImageUrl] = useState("")
  const isImageLoaded = loadedImageUrl === product.mainImageUrl

  async function requestHeightVariants() {
    if (!heightModel || heightVariants !== null || variantsRequest.current) return
    variantsRequest.current = true
    setIsLoadingVariants(true)
    setVariantsError(false)
    try {
      setHeightVariants(await loadProductHeightVariants(initialProduct))
    } catch {
      setVariantsError(true)
      focusHeightOptions.current = false
    } finally {
      variantsRequest.current = false
      setIsLoadingVariants(false)
    }
  }

  const cartItem = items.find(
    (item) => item.product.id === product.id
  )

  const isOutOfStock = product.stock <= 0

  const isMaxQuantityReached =
    cartItem !== undefined &&
    cartItem.quantity >= product.stock

  const formattedPrice = formatPrice(product.price)

  const formattedOldPrice =
    product.oldPrice != null && product.oldPrice > product.price
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
    <article
      className="group/card relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-luxury transition-all duration-300 hover:-translate-y-1 hover:border-foreground/25 dark:hover:border-[#d4af37]/50 hover:shadow-luxury-hover"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") void requestHeightVariants() }}
      onFocus={() => { void requestHeightVariants() }}
    >
      <Link
        href={`/product/${encodeURIComponent(product.slug)}`}
        className="group relative aspect-[2/3] overflow-hidden bg-muted/40"
        aria-label={`Переглянути товар: ${product.name}`}
      >
        {!isImageLoaded && (
          <div className="absolute inset-0 skeleton-shimmer z-0" aria-hidden="true" />
        )}

        <Image
          key={product.mainImageUrl}
          src={failedImageUrl === product.mainImageUrl ? "/product-placeholder.svg" : product.mainImageUrl}
          alt={product.name}
          fill
          loading={priority ? "eager" : "lazy"}
          sizes="(min-width: 1280px) 286px, (min-width: 1024px) calc((100vw - 136px) / 4), (min-width: 768px) calc((100vw - 80px) / 3), (min-width: 640px) calc((100vw - 60px) / 2), calc((100vw - 44px) / 2)"
          onLoad={() => setLoadedImageUrl(product.mainImageUrl)}
          onError={() => {
            setFailedImageUrl(product.mainImageUrl)
            setLoadedImageUrl(product.mainImageUrl)
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
        {/* min-h-[2.75em] = ровно 2 строки (2 × leading-snug 1.375em).
            Раньше min-h-12 был выше двух строк, и из-под line-clamp
            выглядывал верх третьей строки. */}
        <h3 className="min-h-[2.75em] line-clamp-2 break-words font-medium text-[15px] leading-snug text-foreground transition-colors group-hover/card:text-[#8C5E14] dark:group-hover/card:text-[#F3D078]">
          <Link
            href={`/product/${encodeURIComponent(product.slug)}`}
            className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {product.name}
          </Link>
        </h3>

        {product.sku && <p className="mt-1 text-xs text-muted-foreground">Артикул: {product.sku}</p>}

        {heightModel && (
          <div className="mt-2.5" aria-busy={isLoadingVariants}>
            {heightVariants !== null ? (
              <div className="flex flex-wrap gap-1" role="group" aria-label="Вибір висоти">
                {heightVariants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    ref={(node) => {
                      if (node && variant.id === product.id && focusHeightOptions.current) {
                        focusHeightOptions.current = false
                        node.focus()
                      }
                    }}
                    aria-pressed={variant.id === product.id}
                    aria-label={`Висота ${variant.height}${variant.stock <= 0 ? ", немає в наявності" : ""}`}
                    onClick={() => { setSelectedVariantId(variant.id); setIsAdded(false) }}
                    className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      variant.id === product.id
                        ? "border-gold bg-gold/15 font-semibold text-foreground"
                        : "border-border bg-muted/40 text-muted-foreground hover:border-gold/50 hover:text-foreground"
                    }`}
                  >
                    {variant.height}{variant.stock <= 0 && <span className="sr-only"> — немає в наявності</span>}
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onFocus={() => { focusHeightOptions.current = true }}
                onBlur={() => { focusHeightOptions.current = false }}
                onClick={() => { focusHeightOptions.current = true; return requestHeightVariants() }}
                className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground outline-none hover:border-gold/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isLoadingVariants ? "Завантажуємо висоти…" : variantsError ? "Повторити вибір висоти" : `Обрати висоту · ${heightModel.height}`}
              </button>
            )}
            {variantsError && <p role="status" className="mt-1 text-xs text-muted-foreground">Не вдалося завантажити висоти. Спробуйте ще раз.</p>}
          </div>
        )}

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
              isOutOfStock
                ? "bg-red-400"
                : product.stock <= 5
                  ? "bg-amber-500"
                  : "bg-emerald-500/80"
            }`}
            aria-hidden="true"
          />
          <p>
            {isOutOfStock
              ? "Немає в наявності"
              : product.stock <= 5
                ? "Закінчується"
                : "В наявності"}
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
