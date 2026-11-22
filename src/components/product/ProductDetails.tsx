"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react"

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
import { shopConfig } from "@/lib/config/shop"
import { formatPrice } from "@/lib/formatters/price"
import { cn } from "@/lib/utils"
import type { Category } from "@/types/category"
import type { Product } from "@/types/product"
import { ProductHeightLinks } from "@/features/product/ProductHeightLinks"
import type { ProductHeightVariant } from "@/features/product/height-variants"

const GALLERY_IMAGE_SIZES = "(min-width: 1280px) 416px, (min-width: 1024px) min(416px, calc(54vw - 170px)), (min-width: 768px) min(416px, calc(100vw - 148px)), calc(100vw - 32px)"

interface ProductDetailsProps {
  product: Product
  category?: Category
  heightVariants?: ProductHeightVariant[]
}

function StructuredDescription({ description }: { description?: string | null }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!description || !description.trim()) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Опис товару наразі оновлюється нашими менеджерами.
      </div>
    )
  }

  // Очищення від сирих HTML-тегів
  const cleanText = description
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim()

  const paragraphs = cleanText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  const isLong = cleanText.length > 280 || paragraphs.length > 3

  return (
    <div className="space-y-6">
      {/* Ключові властивості виробу у витриманому лаконічному форматі */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 py-3.5 border-y border-border/80 my-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground block">
            Хвоя
          </span>
          <p className="mt-0.5 text-xs sm:text-sm font-semibold text-foreground">
            100% Лита
          </p>
          <p className="text-[11px] text-muted-foreground">Первинний полімер</p>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground block">
            Безпека
          </span>
          <p className="mt-0.5 text-xs sm:text-sm font-semibold text-foreground">
            Без запаху
          </p>
          <p className="text-[11px] text-muted-foreground">Гіпоалергенна, не горить</p>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground block">
            Конструкція
          </span>
          <p className="mt-0.5 text-xs sm:text-sm font-semibold text-foreground">
            Швидка збірка
          </p>
          <p className="text-[11px] text-muted-foreground">Гілки на шарнірах</p>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground block">
            Пакування
          </span>
          <p className="mt-0.5 text-xs sm:text-sm font-semibold text-foreground">
            Заводська коробка
          </p>
          <p className="text-[11px] text-muted-foreground">Для щороку зберігання</p>
        </div>
      </div>

      {/* Контейнер структурованого опису */}
      <div className="relative">
        <div
          className={cn(
            "space-y-3.5 text-sm sm:text-base leading-relaxed text-foreground/90 transition-all duration-300",
            !isExpanded && isLong && "max-h-56 overflow-hidden"
          )}
        >
          {paragraphs.map((para, idx) => {
            const isBullet = /^([•\-\*✔✓\+]|\d+[\.\)])\s+/.test(para)
            if (isBullet) {
              const cleanBullet = para.replace(/^([•\-\*✔✓\+]|\d+[\.\)])\s+/, "")
              return (
                <div key={idx} className="flex items-start gap-2.5 pl-1 text-sm text-foreground/90">
                  <CheckCircle2 className="size-4 shrink-0 text-[#C8923A] dark:text-[#D4AF37] mt-0.5" />
                  <span>{cleanBullet}</span>
                </div>
              )
            }

            const isHeading = (para.endsWith(":") || para.length < 50) && !para.includes(".")
            if (isHeading) {
              return (
                <h4 key={idx} className="pt-2 font-semibold text-foreground text-sm uppercase tracking-wider">
                  {para}
                </h4>
              )
            }

            return (
              <p key={idx} className="leading-7">
                {para}
              </p>
            )
          })}
        </div>

        {/* Градієнт приховання тексту */}
        {!isExpanded && isLong && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/80 to-transparent"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Кнопка розгортання/згортання */}
      {isLong && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/60 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-foreground shadow-xs transition-colors hover:bg-muted cursor-pointer"
          >
            {isExpanded ? (
              <>
                <span>Згорнути опис</span>
                <ChevronUp className="size-3.5" />
              </>
            ) : (
              <>
                <span>Читати опис повністю</span>
                <ChevronDown className="size-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export function ProductDetails({
  product,
  category,
  heightVariants = [],
}: ProductDetailsProps) {
  const galleryImages = getProductGalleryImages(product)
  const attributes = parseProductAttributes(product.attributes)
  const discountPercent = getProductDiscountPercent(product)
  const isOutOfStock = product.stock <= 0
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const [activeTab, setActiveTab] = useState<
    "description" | "attributes" | "delivery"
  >("description")
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
        {/* Галерея изображений */}
        <section aria-label="Галерея товару">
          <div className="md:hidden">
            <div className="flex snap-x snap-mandatory overflow-x-auto rounded-3xl border border-border bg-muted">
              {galleryImages.map((image, index) => (
                <div
                  key={image.src}
                  className="relative aspect-[2/3] min-w-full snap-center"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    sizes={GALLERY_IMAGE_SIZES}
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
                  className={`relative aspect-[2/3] overflow-hidden rounded-xl border bg-muted transition-opacity focus-visible:ring-3 focus-visible:ring-ring/50 ${
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

            <div className="relative aspect-[2/3] w-full max-w-[26rem] overflow-hidden rounded-3xl border border-border bg-muted shadow-luxury">
              {selectedImage && (
                <Image
                  key={selectedImage.src}
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  fill
                  loading="eager"
                  fetchPriority="high"
                  sizes={GALLERY_IMAGE_SIZES}
                  className="object-cover transition-opacity duration-300"
                />
              )}
            </div>
          </div>
        </section>

        {/* Информация о товаре */}
        <section
          className="lg:sticky lg:top-28 lg:self-start"
          aria-labelledby="product-title"
        >
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
            className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl text-foreground"
          >
            {product.name}
          </h1>

          {product.sku && (
            <p className="mt-2 text-xs text-muted-foreground">
              Артикул: {product.sku}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              {formatPrice(product.price)}
            </p>

            {discountPercent !== null && product.oldPrice != null && (
              <p className="text-base text-muted-foreground line-through">
                {formatPrice(product.oldPrice)}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Badge variant={isOutOfStock ? "destructive" : "secondary"}>
              {isOutOfStock ? "Закінчився" : "В наявності"}
            </Badge>
            {!isOutOfStock && (
              <span className="text-xs text-muted-foreground">
                {product.stock} шт. готово до відправки
              </span>
            )}
          </div>

          <ProductHeightLinks variants={heightVariants} productId={product.id} />

          {/* Быстрые гарантии магазина */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/80 pt-5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Truck className="size-4 shrink-0 text-foreground" />
              <span>Відправка Новою Поштою 1–2 дні</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 shrink-0 text-foreground" />
              <span>Сертифікована якість виробника</span>
            </div>
          </div>

          {/* Блок выбора количества и кнопка покупки */}
          <div className="mt-6 border-t border-border pt-6">
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
                  className="h-10 w-12 border-x border-border bg-transparent text-center text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                className="h-11 flex-1 rounded-full bg-foreground text-background font-semibold uppercase tracking-wider text-xs shadow-sm hover:bg-foreground/90 cursor-pointer"
                disabled={!canAddToCart}
                onClick={handleAddToCart}
              >
                <ShoppingBag className="mr-1.5 size-4" />
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
              {shopConfig.payment.iban
                ? "Оплата при отриманні Новою Поштою або за реквізитами IBAN ФОП."
                : "Оплата при отриманні Новою Поштою."}
            </p>
          </div>
        </section>
      </div>

      {/* Опис, характеристики, доставка та оплата */}
      <div id="product-tabs" className="mt-16 border-t border-border pt-10 sm:mt-24 sm:pt-14 scroll-mt-28">
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("description")}
            className={cn(
              "rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer",
              activeTab === "description"
                ? "bg-foreground text-background shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Опис виробу
          </button>

          {attributes.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("attributes")}
              className={cn(
                "rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer",
                activeTab === "attributes"
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Характеристики ({attributes.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("delivery")}
            className={cn(
              "rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer",
              activeTab === "delivery"
                ? "bg-foreground text-background shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Доставка та оплата
          </button>
        </div>

        {/* Содержимое активной вкладки */}
        <div className="mt-8">
          {/* Вкладка 1: Опис товару */}
          {activeTab === "description" && (
            <div className="space-y-10 animate-in fade-in duration-300">
              <StructuredDescription description={product.description} />

              {/* 4 картки фабричних переваг виробу */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                  <ShieldCheck className="size-5 text-[#C8923A] dark:text-[#D4AF37]" />
                  <p className="mt-2 text-sm font-semibold text-foreground">100% Безпечні матеріали</p>
                  <p className="mt-1 text-xs text-muted-foreground">Харчовий еко-полімер, гіпоалергенна хвоя без неприємного запаху.</p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                  <CheckCircle2 className="size-5 text-[#C8923A] dark:text-[#D4AF37]" />
                  <p className="mt-2 text-sm font-semibold text-foreground">Пожежобезпечність</p>
                  <p className="mt-1 text-xs text-muted-foreground">Хвоя не підтримує горіння, а плавиться. Безпечно для дітей та тварин.</p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                  <RotateCcw className="size-5 text-[#C8923A] dark:text-[#D4AF37]" />
                  <p className="mt-2 text-sm font-semibold text-foreground">Служба 10+ сезонів</p>
                  <p className="mt-1 text-xs text-muted-foreground">Гілочки не деформуються, не ламаються і зберігають пишність роками.</p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                  <Truck className="size-5 text-[#C8923A] dark:text-[#D4AF37]" />
                  <p className="mt-2 text-sm font-semibold text-foreground">Щільна упаковка</p>
                  <p className="mt-1 text-xs text-muted-foreground">Постачається у надійній фірмовій коробці, зручній для сезонного зберігання.</p>
                </div>
              </div>
            </div>
          )}

          {/* Вкладка 2: Характеристики */}
          {activeTab === "attributes" && attributes.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border/90 bg-card shadow-xs animate-in fade-in duration-300">
              <dl className="divide-y divide-border">
                {attributes.map(([key, value], idx) => (
                  <div
                    key={key}
                    className={`grid gap-1 px-5 py-3.5 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:gap-6 ${
                      idx % 2 === 0 ? "bg-card" : "bg-muted/20"
                    }`}
                  >
                    <dt className="text-sm text-muted-foreground font-medium">
                      {formatProductAttributeLabel(key)}
                    </dt>
                    <dd className="text-sm font-semibold text-foreground">
                      {formatProductAttributeValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Вкладка 3: Доставка и оплата */}
          {activeTab === "delivery" && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 animate-in fade-in duration-300">
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
                <Truck className="size-6 text-[#C8923A] dark:text-[#D4AF37]" />
                <h4 className="mt-3 text-base font-semibold text-foreground">Доставка Новою Поштою</h4>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Швидка відправка по всій Україні протягом 1–2 робочих днів. Доставка у будь-яке відділення, поштомат або адресна доставка кур&apos;єром.
                </p>
                <p className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Доставка оплачується за тарифами Нової Пошти
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
                <CreditCard className="size-6 text-[#C8923A] dark:text-[#D4AF37]" />
                <h4 className="mt-3 text-base font-semibold text-foreground">Зручні способи оплати</h4>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  • Оплата при отриманні (післяплата) після огляду виробу у відділенні.
                  {shopConfig.payment.iban && <><br />• Оплата за реквізитами IBAN ФОП.</>}
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
                <RotateCcw className="size-6 text-[#C8923A] dark:text-[#D4AF37]" />
                <h4 className="mt-3 text-base font-semibold text-foreground">Гарантія та повернення</h4>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  14 днів на повернення або обмін відповідно до Закону України «Про захист прав споживачів». Ви можете спокійно перевірити виріб при отриманні.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
