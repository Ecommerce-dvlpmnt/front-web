"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, ShoppingBag } from "lucide-react"

import { useCart } from "@/components/cart/CartContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  formatProductAttributeLabel,
  formatProductAttributeValue,
  getProductDiscountPercent,
  getProductGalleryImages,
  parseProductAttributes,
} from "@/features/product/product-utils"
import { formatPrice } from "@/lib/formatters/price"
import type { Category } from "@/types/category"
import type { Product } from "@/types/product"

interface ProductDetailsProps {
  product: Product
  category?: Category
}

export function ProductDetails({
  product,
  category,
}: ProductDetailsProps) {
  const galleryImages = getProductGalleryImages(product)
  const attributes = parseProductAttributes(product.attributes)
  const discountPercent = getProductDiscountPercent(product)
  const isOutOfStock = product.stock <= 0
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const { addItem, items } = useCart()

  const cartQuantity =
    items.find((item) => item.product.id === product.id)?.quantity ?? 0
  const canAddToCart =
    !isOutOfStock && cartQuantity + quantity <= product.stock
  const selectedImage = galleryImages[selectedImageIndex] ?? galleryImages[0]

  useEffect(() => {
    if (!isAdded) return

    const timeout = window.setTimeout(() => {
      setIsAdded(false)
    }, 1200)

    return () => window.clearTimeout(timeout)
  }, [isAdded])

  function updateQuantity(nextQuantity: number) {
    const maxQuantity = Math.max(product.stock, 1)
    const safeQuantity = Number.isFinite(nextQuantity)
      ? Math.min(Math.max(Math.round(nextQuantity), 1), maxQuantity)
      : 1

    setQuantity(safeQuantity)
  }

  function handleAddToCart() {
    if (!canAddToCart) return

    addItem(product, quantity)

    setIsAdded(true)
  }

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.92fr)] lg:gap-16">
        <section aria-label="Галерея товару">
          <div className="md:hidden">
            <div className="flex snap-x snap-mandatory overflow-x-auto rounded-3xl border border-border bg-muted">
              {galleryImages.map((image, index) => (
                <div
                  key={image.src}
                  className="relative aspect-square min-w-full snap-center"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Проведіть, щоб переглянути всі фото
            </p>
          </div>

          <div className="hidden gap-4 md:grid md:grid-cols-[5.25rem_minmax(0,1fr)]">
            <div className="flex flex-col gap-3">
              {galleryImages.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  className={`relative aspect-square overflow-hidden rounded-xl border bg-muted transition-opacity focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    selectedImageIndex === index
                      ? "border-foreground"
                      : "border-border opacity-65 hover:opacity-100"
                  }`}
                  aria-label={`Показати фото ${index + 1}`}
                  aria-pressed={selectedImageIndex === index}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <Image
                    src={image.src}
                    alt=""
                    fill
                    sizes="84px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>

            <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-muted">
              {selectedImage && (
                <Image
                  key={selectedImage.src}
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  fill
                  priority
                  sizes="(min-width: 1280px) 54vw, 50vw"
                  className="object-cover transition-opacity duration-300"
                />
              )}
            </div>
          </div>
        </section>

        <section className="lg:sticky lg:top-28 lg:self-start" aria-labelledby="product-title">
          <div className="flex flex-wrap items-center gap-2">
            {category ? (
              <Link
                href={`/catalog/${category.slug}`}
                className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase underline-offset-4 hover:underline"
              >
                {category.name}
              </Link>
            ) : product.categoryName ? (
              <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {product.categoryName}
              </span>
            ) : (
              <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Товар
              </span>
            )}

            {discountPercent !== null && (
              <Badge variant="destructive">−{discountPercent}%</Badge>
            )}
          </div>

          <h1
            id="product-title"
            className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {product.name}
          </h1>

          {product.sku && (
            <p className="mt-3 text-sm text-muted-foreground">
              Артикул: {product.sku}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-3xl font-semibold tracking-tight">
              {formatPrice(product.price)}
            </p>

            {discountPercent !== null && product.oldPrice != null && (
              <p className="text-base text-muted-foreground line-through">
                {formatPrice(product.oldPrice)}
              </p>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Badge variant={isOutOfStock ? "destructive" : "secondary"}>
              {isOutOfStock ? "Закінчився" : "В наявності"}
            </Badge>
            {!isOutOfStock && (
              <span className="text-sm text-muted-foreground">
                {product.stock} шт. доступно
              </span>
            )}
          </div>

          <div className="mt-8 border-t border-border pt-7">
            <label
              htmlFor="product-quantity"
              className="text-sm font-medium"
            >
              Кількість
            </label>

            <div className="mt-3 flex gap-3">
              <div className="flex h-10 items-center rounded-lg border border-border bg-background">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Зменшити кількість"
                  disabled={isOutOfStock || quantity <= 1}
                  onClick={() => updateQuantity(quantity - 1)}
                >
                  <Minus />
                </Button>
                <input
                  id="product-quantity"
                  type="number"
                  min={1}
                  max={Math.max(product.stock, 1)}
                  value={quantity}
                  disabled={isOutOfStock}
                  aria-label="Кількість товару"
                  className="h-10 w-12 appearance-none border-x border-border bg-transparent text-center text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  onChange={(event) =>
                    updateQuantity(Number(event.target.value))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Збільшити кількість"
                  disabled={isOutOfStock || quantity >= product.stock}
                  onClick={() => updateQuantity(quantity + 1)}
                >
                  <Plus />
                </Button>
              </div>

              <Button
                type="button"
                className="h-10 flex-1"
                disabled={!canAddToCart}
                onClick={handleAddToCart}
              >
                <ShoppingBag />
                {isOutOfStock
                  ? "Немає в наявності"
                  : !canAddToCart
                    ? "Максимальна кількість у кошику"
                    : isAdded
                      ? "Додано до кошика ✓"
                      : "Додати в кошик"}
              </Button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Кількість можна змінити в кошику перед оформленням замовлення.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-16 grid gap-10 border-t border-border pt-10 sm:mt-24 sm:pt-14 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-16">
        <section aria-labelledby="product-description-title">
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Деталі
          </p>
          <h2
            id="product-description-title"
            className="mt-3 text-2xl font-semibold tracking-tight"
          >
            Опис товару
          </h2>
        </section>

        <div>
          <p className="whitespace-pre-line text-base leading-8 text-muted-foreground">
            {product.description || "Опис товару поки що не доданий."}
          </p>

          {attributes.length > 0 && (
            <div className="mt-10 overflow-hidden rounded-2xl border border-border">
              <h3 className="border-b border-border bg-muted/50 px-5 py-4 text-sm font-semibold">
                Характеристики
              </h3>
              <dl className="divide-y divide-border">
                {attributes.map(([key, value]) => (
                  <div
                    key={key}
                    className="grid gap-1 px-5 py-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-6"
                  >
                    <dt className="text-sm text-muted-foreground">
                      {formatProductAttributeLabel(key)}
                    </dt>
                    <dd className="text-sm font-medium">
                      {formatProductAttributeValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
