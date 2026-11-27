
"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ChevronDown,
  Menu,
  ShoppingBag,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { BrandLogo } from "@/components/layout/BrandLogo"
import { CartDrawer } from "@/components/cart/CartDrawer"
import { useCart } from "@/components/cart/CartContext"
import { shopConfig } from "@/lib/config/shop"
import { getCatalogHref } from "@/features/catalog/navigation"
import { cn } from "@/lib/utils"
import type { CategoryTreeNode } from "@/types/category"

interface HeaderProps {
  categories: CategoryTreeNode[]
}

export function Header({ categories = [] }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  const { itemCount } = useCart()

  // Виділяємо 3 основні напрямки каталогу (щоб хедер не перевантажувався):
  // 1. Ялинки (всі ялинки + підвиди: Литі, Преміум, Засніжені, В горщиках, ПВХ)
  // 2. Різдвяні вінки
  // 3. Хвойні гірлянди
  const treeCategories = (categories ?? []).filter((c) =>
    c.slug.includes("yalyn") ||
    c.slug.includes("horshchyk") ||
    c.name.toLowerCase().includes("ялин")
  )

  const wreathsCategory = (categories ?? []).find((c) =>
    c.slug === "rizdvyani-vinky" || c.name.toLowerCase().includes("вінк")
  )

  const garlandsCategory = (categories ?? []).find((c) =>
    c.slug === "khvoyni-hirlyandy" ||
    c.slug.includes("girlyand") ||
    c.name.toLowerCase().includes("гірлянд")
  )

  const otherCategories = (categories ?? []).filter((c) =>
    !treeCategories.some((t) => t.id === c.id) &&
    c.id !== wreathsCategory?.id &&
    c.id !== garlandsCategory?.id
  )

  return (
    <>
      {/* Сенсорные устройства (pointer: coarse): сплошной фон без backdrop-blur.
          Размытие поверх прокручиваемой страницы и анимированного снега
          пересчитывается каждый кадр и на слабых GPU даёт подёргивание хедера.
          Устройства с мышью (pointer-fine): полупрозрачный фон с размытием, как раньше.
          transform-gpu выносит хедер в отдельный GPU-слой — это стабилизирует
          sticky в iOS Safari. */}
      <header className="sticky top-0 z-50 transform-gpu border-b border-border/80 bg-background pointer-fine:bg-background/90 pointer-fine:backdrop-blur-md">
        <div className="border-b border-[#D4AF37]/30 dark:border-[#20362C] bg-gradient-to-r from-[#F2E8D5] via-[#FAF4E8] to-[#F2E8D5] dark:from-[#0B1511] dark:via-[#15271F] dark:to-[#0B1511] px-3 py-1 sm:px-4 sm:py-1.5 text-center text-[10.5px] sm:text-xs leading-snug font-medium tracking-wide sm:tracking-wider text-[#4A3208] dark:text-[#E8D9C0] transition-colors">
          <span className="hidden sm:inline text-[#8C5E14]/70 dark:text-[#F3D078]/70 mr-2" aria-hidden="true">✦</span>
          <span>{shopConfig.seasonal.announcement}</span>
          <span className="hidden sm:inline text-[#8C5E14]/70 dark:text-[#F3D078]/70 ml-2" aria-hidden="true">✦</span>
        </div>

        {/* На узких экранах (до sm) отступы и промежутки меньше,
            чтобы строка хедера помещалась даже в 320–360px. */}
        <div className="mx-auto flex h-15.5 sm:h-16 max-w-7xl items-center gap-1.5 px-2.5 sm:gap-3 sm:px-6 lg:h-18 lg:gap-6 lg:px-8">
          {/* Кнопка мобільного меню */}
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden size-10 shrink-0 rounded-full"
            aria-label={isMenuOpen ? "Закрити меню" : "Відкрити меню"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>

          {/* Логотип бренду з фірмовою ялинкою та вишуканою типографікою */}
          <Link
            href="/"
            className="group flex shrink-0 items-center overflow-visible py-1 transition-transform duration-200 hover:scale-[1.015] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
            aria-label={`${shopConfig.name} — на головну`}
          >
            <BrandLogo
              className="max-[22rem]:gap-1.5"
              treeClassName="h-[28px] min-[22rem]:h-[32px] sm:h-[37px] md:h-[40px] lg:h-[42px] w-auto shrink-0"
              textClassName="h-[30px] min-[22rem]:h-[36px] sm:h-[42px] md:h-[45px] lg:h-[48px] w-auto shrink-0"
            />
          </Link>

          {/* Навігація: тільки основні категорії — акуратно, з комфортним повітрям від логотипу */}
          <nav
            className="hidden items-center gap-5 xl:flex shrink-0 min-w-0"
            aria-label="Категорії"
          >
            {/* 1. Ялинки (з випадаючим меню підкатегорій при наведенні) */}
            <div className="relative group py-2">
              <Link
                href={getCatalogHref()}
                prefetch={false}
                className="flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-medium text-foreground/80 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
              >
                <span>Ялинки</span>
                {treeCategories.length > 0 && (
                  <ChevronDown className="size-3 text-muted-foreground transition-transform duration-200 group-hover:rotate-180" />
                )}
              </Link>

              {treeCategories.length > 0 && (
                <div className="invisible group-hover:visible group-focus-within:visible opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-200 absolute left-0 top-full pt-1.5 z-50 min-w-56">
                  <div className="rounded-2xl border border-border/80 bg-background/95 p-2 shadow-xl backdrop-blur-md">
                    <Link
                      href={getCatalogHref()}
                      prefetch={false}
                      className="block rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground outline-none hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
                    >
                      Всі ялинки
                    </Link>
                    <div className="my-1 border-t border-border/50" />
                    {treeCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={getCatalogHref({ categorySlug: cat.slug })}
                        prefetch={false}
                        className="block rounded-lg px-3 py-1.5 text-xs text-muted-foreground outline-none hover:text-foreground hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Різдвяні вінки */}
            <Link
              href={getCatalogHref({ categorySlug: wreathsCategory?.slug ?? "rizdvyani-vinky" })}
              prefetch={false}
              className="rounded-md px-1 py-2 text-sm font-medium text-foreground/80 outline-none transition-colors hover:text-foreground whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
            >
              {wreathsCategory?.name ?? "Різдвяні вінки"}
            </Link>

            {/* 3. Хвойні гірлянди */}
            <Link
              href={getCatalogHref({ categorySlug: garlandsCategory?.slug ?? "khvoyni-hirlyandy" })}
              prefetch={false}
              className="rounded-md px-1 py-2 text-sm font-medium text-foreground/80 outline-none transition-colors hover:text-foreground whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
            >
              {garlandsCategory?.name ?? "Хвойні гірлянди"}
            </Link>

            {/* Інші можливі додаткові категорії */}
            {otherCategories.map((category) => (
              <Link
                key={category.id}
                href={getCatalogHref({ categorySlug: category.slug })}
                prefetch={false}
                className="rounded-md px-1 py-2 text-sm font-medium text-foreground/80 outline-none transition-colors hover:text-foreground whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <ThemeToggle />

            <Button
              variant="ghost"
              size="icon"
              className="relative size-10 rounded-full text-foreground hover:bg-muted"
              aria-label={`Кошик, ${itemCount} товарів`}
              aria-expanded={isCartOpen}
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="size-4.5" />

              {itemCount > 0 && (
                <Badge className="absolute right-0 top-0 min-w-4.5 h-4.5 rounded-full border-2 border-background bg-foreground dark:bg-[#D4AF37] px-1 text-[0.625rem] font-bold leading-none text-background dark:text-[#0B0F0E] flex items-center justify-center">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        <div
          id="mobile-navigation"
          className={cn(
            "border-t border-[#D4AF37]/25 bg-gradient-to-b from-background to-muted/35 dark:from-[#0C1411] dark:to-[#101C17] px-4 py-4 shadow-xl xl:hidden",
            isMenuOpen ? "block" : "hidden"
          )}
        >
          <nav
            className="flex flex-col gap-1"
            aria-label="Мобільна навігація"
          >
            {/* Ялинки */}
            <div className="flex flex-col">
              <Link
                href={getCatalogHref()}
                prefetch={false}
                className="flex min-h-11 items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
                onClick={() => setIsMenuOpen(false)}
              >
                Ялинки
              </Link>

              {treeCategories.length > 0 && (
                <div className="ml-3.5 flex flex-col gap-0.5 border-l-2 border-[#D4AF37]/35 pl-3 mb-1.5">
                  {treeCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={getCatalogHref({ categorySlug: cat.slug })}
                      prefetch={false}
                      className="flex min-h-10 items-center rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Різдвяні вінки */}
            <Link
              href={getCatalogHref({ categorySlug: wreathsCategory?.slug ?? "rizdvyani-vinky" })}
              prefetch={false}
              className="flex min-h-11 items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
              onClick={() => setIsMenuOpen(false)}
            >
              {wreathsCategory?.name ?? "Різдвяні вінки"}
            </Link>

            {/* Хвойні гірлянди */}
            <Link
              href={getCatalogHref({ categorySlug: garlandsCategory?.slug ?? "khvoyni-hirlyandy" })}
              prefetch={false}
              className="flex min-h-11 items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
              onClick={() => setIsMenuOpen(false)}
            >
              {garlandsCategory?.name ?? "Хвойні гірлянди"}
            </Link>

            {/* Додаткові категорії */}
            {otherCategories.map((category) => (
              <Link
                key={category.id}
                href={getCatalogHref({ categorySlug: category.slug })}
                prefetch={false}
                className="flex min-h-11 items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
                onClick={() => setIsMenuOpen(false)}
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </>
  )
}
