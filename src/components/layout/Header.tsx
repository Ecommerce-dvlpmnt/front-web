"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { shopConfig } from "@/lib/config/shop"
import { cn } from "@/lib/utils"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="bg-foreground px-4 py-2 text-center text-[11px] font-medium tracking-wide text-background sm:text-xs">
        {shopConfig.seasonal.announcement}
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:h-[4.5rem] lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={isMenuOpen ? "Закрити меню" : "Відкрити меню"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </Button>

        <Link
          href="/"
          className="group flex min-w-fit items-center gap-2"
          aria-label={`${shopConfig.name} — на головну`}
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold tracking-tight text-background transition-transform group-hover:scale-105">
            {shopConfig.name.slice(0, 1)}
          </span>
          <span className="hidden text-sm font-semibold tracking-[0.18em] uppercase sm:inline">
            {shopConfig.name}
          </span>
        </Link>

        <form
          action="/#catalog"
          className="relative mx-auto hidden w-full max-w-md lg:block"
          role="search"
        >
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            name="query"
            type="search"
            placeholder="Пошук товарів..."
            aria-label="Пошук товарів"
            className="h-10 rounded-full border-transparent bg-muted/60 pl-10 pr-4 focus-visible:bg-background"
          />
        </form>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Категорії">
          {shopConfig.navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Показати пошук"
            aria-expanded={isMobileSearchOpen}
            onClick={() => setIsMobileSearchOpen((open) => !open)}
          >
            <Search />
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" aria-label="Обране">
            <Heart />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Кошик, 0 товарів"
          >
            <ShoppingBag />
            <Badge className="absolute -top-0.5 -right-0.5 min-w-4 border-2 border-background bg-foreground px-1 text-[10px] leading-3 text-background">
              0
            </Badge>
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-border/60 px-4 py-3 lg:hidden",
          isMobileSearchOpen ? "block" : "hidden",
        )}
      >
        <form action="/#catalog" className="relative" role="search">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            name="query"
            type="search"
            placeholder="Пошук товарів..."
            aria-label="Пошук товарів"
            className="rounded-full bg-muted/60 pl-10"
          />
        </form>
      </div>

      <div
        id="mobile-navigation"
        className={cn(
          "border-t border-border/60 bg-background px-4 py-4 lg:hidden",
          isMenuOpen ? "block" : "hidden",
        )}
      >
        <nav className="flex flex-col gap-1" aria-label="Мобільна навігація">
          {shopConfig.navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
