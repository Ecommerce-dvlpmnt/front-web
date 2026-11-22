"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"

import { ProductGrid } from "@/components/catalog/ProductGrid"
import type { CategoryTreeNode } from "@/types/category"
import type { Product } from "@/types/product"
import { formatCategoryName } from "@/lib/formatters/category"
import { scrollToElement } from "@/lib/scroll"
import { cn } from "@/lib/utils"

interface CatalogSectionProps {
  title: string
  eyebrow: string
  description: string
  products: Product[]
  categories?: CategoryTreeNode[]
  activeCategorySlug?: string
  searchQuery?: string
}

function findCategory(nodes: CategoryTreeNode[], slug: string): CategoryTreeNode | null {
  for (const n of nodes) {
    if (n.slug === slug) return n
    if (n.children?.length) {
      const found = findCategory(n.children, slug)
      if (found) return found
    }
  }
  // Гнучкий пошук, якщо слаг частково збігається (наприклад, "yalynky" та "lyti-yalynky" або "shtuchni-yalynky")
  for (const n of nodes) {
    if (n.slug.includes(slug) || slug.includes(n.slug)) return n
  }
  return null
}

function collectCategoryIds(cat: CategoryTreeNode): Set<string> {
  const ids = new Set<string>([cat.id])
  if (cat.children?.length) {
    for (const child of cat.children) {
      ids.add(child.id)
      if (child.children?.length) {
        for (const grand of child.children) {
          ids.add(grand.id)
        }
      }
    }
  }
  return ids
}

export function CatalogSection({
  title,
  eyebrow,
  description,
  products,
  categories = [],
  activeCategorySlug,
  searchQuery,
}: CatalogSectionProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | undefined>(
    activeCategorySlug
  )
  const [isPending, startTransition] = useTransition()

  // Верхній рівень категорій з бази даних
  const topCategories = useMemo(() => {
    const roots = categories.filter((c) => c.parentId === null)
    return roots.length > 0 ? roots : categories
  }, [categories])

  // Синхронізація при навігації назад/вперед
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname
      if (path.startsWith("/catalog/")) {
        const slug = path.replace("/catalog/", "").split("/")[0]
        startTransition(() => setSelectedSlug(slug))
      } else {
        startTransition(() => setSelectedSlug(undefined))
      }
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  // Слухаємо кліки по категоріях із Хедера
  useEffect(() => {
    const onSelectCategory = (e: Event) => {
      const detail = (e as CustomEvent<string | undefined>).detail
      startTransition(() => setSelectedSlug(detail))
    }

    window.addEventListener("selectCatalogCategory", onSelectCategory)
    return () => window.removeEventListener("selectCatalogCategory", onSelectCategory)
  }, [])

  // Поточна вибрана категорія
  const currentCategory = useMemo(() => {
    return selectedSlug ? findCategory(categories, selectedSlug) : null
  }, [categories, selectedSlug])

  // Підрахунок кількості товарів у кожній реальній категорії бази
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const cat of topCategories) {
      const ids = collectCategoryIds(cat)
      const count = products.filter(
        (p) =>
          (p.categoryId ? ids.has(p.categoryId) : false) ||
          p.categorySlug === cat.slug ||
          (p.categoryName && p.categoryName.toLowerCase() === cat.name.toLowerCase())
      ).length
      map.set(cat.id, count)
    }
    return map
  }, [products, topCategories])

  const currentTitle = useMemo(() => {
    if (!selectedSlug) return title
    return currentCategory ? formatCategoryName(currentCategory.name) : title
  }, [selectedSlug, title, currentCategory])

  // Динамічна фільтрація товарів за реальною категорією
  const displayedProducts = useMemo(() => {
    if (!selectedSlug) return products

    if (currentCategory) {
      const ids = collectCategoryIds(currentCategory)
      const filtered = products.filter(
        (p) =>
          (p.categoryId ? ids.has(p.categoryId) : false) ||
          p.categorySlug === selectedSlug ||
          (p.categoryName &&
            p.categoryName.toLowerCase() === currentCategory.name.toLowerCase())
      )
      return filtered.length > 0 ? filtered : products
    }

    const filtered = products.filter((p) => p.categorySlug === selectedSlug)
    return filtered.length > 0 ? filtered : products
  }, [products, selectedSlug, currentCategory])

  const handleCategoryClick = (
    e: React.MouseEvent,
    slug?: string,
    shouldScroll = false
  ) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()

    if (selectedSlug === slug) return

    startTransition(() => {
      setSelectedSlug(slug)
    })

    const newUrl = slug ? `/catalog/${slug}#catalog` : "/#catalog"
    window.history.pushState(null, "", newUrl)

    if (shouldScroll) {
      scrollToElement("catalog", 1.5)
    }
  }

  // Підкатегорії поточної вибраної категорії (якщо є в базі)
  const subcategories = useMemo(() => {
    if (!currentCategory) return []
    if (currentCategory.children?.length) return currentCategory.children
    // Якщо вибрана підкатегорія — показати "сусідів" із батьківської
    if (currentCategory.parentId) {
      const parent = categories.find((c) => c.id === currentCategory.parentId)
      return parent?.children ?? []
    }
    return []
  }, [currentCategory, categories])

  return (
    <section id="catalog" className="scroll-mt-24 py-16 sm:py-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[#A0772D] dark:text-[#D4AF37] uppercase">
            {eyebrow}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl text-foreground transition-all duration-300">
            {currentTitle}
          </h1>
        </div>

        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Навігація розділів каталогу на основі категорій з бази даних */}
      <nav
        className="mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none"
        aria-label="Основні розділи каталогу"
      >
        <Link
          href="/#catalog"
          onClick={(e) => handleCategoryClick(e, undefined)}
          className={cn(
            "group relative shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-all duration-200 shadow-xs cursor-pointer",
            !selectedSlug
              ? "border-transparent bg-[#181512] text-[#FAF8F5] dark:bg-[#D4AF37] dark:text-[#0B0F0E] shadow-sm"
              : "border-border/80 bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          )}
          aria-current={!selectedSlug ? "page" : undefined}
        >
          Усі товари ({products.length})
        </Link>

        {topCategories.map((category) => {
          const isCategoryActive =
            selectedSlug === category.slug ||
            (currentCategory && collectCategoryIds(category).has(currentCategory.id))
          const count = categoryCounts.get(category.id) ?? 0

          return (
            <Link
              key={category.id}
              href={`/catalog/${category.slug}#catalog`}
              onClick={(e) => handleCategoryClick(e, category.slug)}
              className={cn(
                "group relative shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-all duration-200 shadow-xs cursor-pointer",
                isCategoryActive
                  ? "border-transparent bg-[#181512] text-[#FAF8F5] dark:bg-[#D4AF37] dark:text-[#0B0F0E] shadow-sm"
                  : "border-border/80 bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              )}
              aria-current={isCategoryActive ? "page" : undefined}
            >
              {category.name} ({count})
            </Link>
          )
        })}
      </nav>

      {/* Підкатегорії: якщо вони існують у базі для обраної категорії */}
      {subcategories.length > 0 && currentCategory && (
        <div
          className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none animate-in fade-in slide-in-from-top-1 duration-300"
          aria-label="Підкатегорії"
        >
          <span className="shrink-0 text-[11px] font-medium tracking-wider text-muted-foreground uppercase mr-1">
            Підкатегорія:
          </span>

          {subcategories.map((sub) => {
            const isSubActive = selectedSlug === sub.slug
            return (
              <button
                key={sub.id}
                type="button"
                onClick={(e) => handleCategoryClick(e, sub.slug)}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                  isSubActive
                    ? "bg-foreground/10 text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {formatCategoryName(sub.name)}
              </button>
            )
          })}
        </div>
      )}

      {/* М'який плавний перехід сітки товарів при зміні категорії */}
      <div
        className={cn(
          "mt-8 transition-all duration-300 ease-out",
          isPending
            ? "opacity-35 scale-[0.99] translate-y-1 blur-[0.5px]"
            : "opacity-100 scale-100 translate-y-0 blur-0"
        )}
      >
        <ProductGrid
          key={`${selectedSlug ?? "all"}:${searchQuery ?? ""}`}
          products={displayedProducts}
          searchQuery={searchQuery}
          itemListName={currentTitle}
          eagerImages={Boolean(activeCategorySlug)}
        />
      </div>
    </section>
  )
}
