
"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ChevronDown,
  Menu,
  Search,
  ShoppingBag,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
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
        <div className="border-b border-[#D4AF37]/30 dark:border-[#20362C] bg-gradient-to-r from-[#F2E8D5] via-[#FAF4E8] to-[#F2E8D5] dark:from-[#0B1511] dark:via-[#15271F] dark:to-[#0B1511] px-4 py-1.5 text-center text-[0.6875rem] sm:text-[0.75rem] font-medium tracking-wider text-[#4A3208] dark:text-[#E8D9C0] transition-colors">
          <span>{shopConfig.seasonal.announcement}</span>
        </div>

        {/* На узких экранах (до sm) отступы и промежутки меньше,
            чтобы строка хедера помещалась даже в 320–360px. */}
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:h-18 lg:gap-6 lg:px-8">
          {/* Кнопка мобільного меню */}
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden shrink-0"
            aria-label={isMenuOpen ? "Закрити меню" : "Відкрити меню"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>

          {/* Логотип бренду з фірмовою ялинкою та вишуканою типографікою */}
          <Link
            href="/"
            className="group flex shrink-0 items-center transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
            aria-label={`${shopConfig.name} — на головну`}
          >
            <BrandLogo
              className="max-[22rem]:gap-1.5"
              treeClassName="h-[26px] min-[22rem]:h-[30px] sm:h-[35px] md:h-[38px] lg:h-[40px] w-auto shrink-0"
              textClassName="h-[28px] min-[22rem]:h-[35px] sm:h-[40px] md:h-[44px] lg:h-[46px] w-auto shrink-0"
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
                className="flex items-center gap-1 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
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
                      className="block rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      Всі ялинки
                    </Link>
                    <div className="my-1 border-t border-border/50" />
                    {treeCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={getCatalogHref({ categorySlug: cat.slug })}
                        prefetch={false}
                        className="block rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground py-2 whitespace-nowrap"
            >
              {wreathsCategory?.name ?? "Різдвяні вінки"}
            </Link>

            {/* 3. Хвойні гірлянди */}
            <Link
              href={getCatalogHref({ categorySlug: garlandsCategory?.slug ?? "khvoyni-hirlyandy" })}
              prefetch={false}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground py-2 whitespace-nowrap"
            >
              {garlandsCategory?.name ?? "Хвойні гірлянди"}
            </Link>

            {/* Інші можливі додаткові категорії */}
            {otherCategories.map((category) => (
              <Link
                key={category.id}
                href={getCatalogHref({ categorySlug: category.slug })}
                prefetch={false}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground py-2 whitespace-nowrap"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          {/* Пошук товарів (розміщений праворуч після категорій) */}
          <form
            action="/#catalog"
            className="relative hidden md:block w-44 lg:w-56 xl:w-64 ml-auto shrink-0 transition-all duration-300 focus-within:w-56 xl:focus-within:w-72"
            role="search"
          >
            <Search className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />

            <Input
              name="query"
              type="search"
              placeholder="Пошук..."
              aria-label="Пошук товарів"
              className="h-9.5 rounded-full border border-border/80 bg-muted/50 pl-9 pr-3.5 text-xs shadow-none transition-colors hover:bg-muted/80 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring"
            />
          </form>

          {/* Дії справа: Пошук для планшетів + Тема + Кошик.
              ml-auto прижимает иконки вправо, пока поле поиска скрыто (до md);
              на md поле поиска само делает ml-auto, поэтому здесь md:ml-0. */}
          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2 md:ml-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Показати пошук"
              aria-expanded={isMobileSearchOpen}
              onClick={() => setIsMobileSearchOpen((open) => !open)}
            >
              <Search className="size-4" />
            </Button>

            <ThemeToggle />

            <Button
              variant="ghost"
              size="icon"
              className="relative text-foreground hover:bg-muted"
              aria-label={`Кошик, ${itemCount} товарів`}
              aria-expanded={isCartOpen}
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="size-4" />

              {itemCount > 0 && (
                <Badge className="absolute -right-0.5 -top-0.5 min-w-4.5 h-4.5 rounded-full border-2 border-background bg-foreground px-1 text-[0.625rem] font-bold leading-none text-background flex items-center justify-center">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "border-t border-border/60 px-4 py-3 xl:hidden",
            isMobileSearchOpen ? "block" : "hidden"
          )}
        >
          <form action="/#catalog" className="relative" role="search">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              name="query"
              type="search"
              placeholder="Пошук..."
              aria-label="Пошук товарів"
              className="rounded-full bg-muted/60 pl-10"
            />
          </form>
        </div>

        <div
          id="mobile-navigation"
          className={cn(
            "border-t border-border/60 bg-background px-4 py-4 xl:hidden",
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
                className="block rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                onClick={() => setIsMenuOpen(false)}
              >
                Ялинки
              </Link>

              {treeCategories.length > 0 && (
                <div className="ml-3 flex flex-col gap-0.5 border-l border-border pl-3 mb-1">
                  {treeCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={getCatalogHref({ categorySlug: cat.slug })}
                      prefetch={false}
                      className="block rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
              className="block rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted"
              onClick={() => setIsMenuOpen(false)}
            >
              {wreathsCategory?.name ?? "Різдвяні вінки"}
            </Link>

            {/* Хвойні гірлянди */}
            <Link
              href={getCatalogHref({ categorySlug: garlandsCategory?.slug ?? "khvoyni-hirlyandy" })}
              prefetch={false}
              className="block rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted"
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
                className="block rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted"
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
