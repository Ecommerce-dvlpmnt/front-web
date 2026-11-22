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

function extractHeightLabel(name: string): { label: string; meters: number } | null {
  const match = name.match(/(\d+[.,]?\d*)\s*(м|см)(?=\s|$|\))/i)
  if (!match) return null
  const rawNum = parseFloat(match[1].replace(",", "."))
  if (Number.isNaN(rawNum)) return null
  const unit = match[2].toLowerCase()
  if (unit === "см") {
    const meters = rawNum / 100
    const label = rawNum >= 100 ? `${Number(meters.toFixed(2))} м` : `${Math.round(rawNum)} см`
    return { label, meters }
  }
  return { label: `${Number(rawNum.toFixed(2))} м`, meters: rawNum }
}

function getTreeModelKey(product: Product): string | null {
  const lower = product.name.toLowerCase()
  const isTreeOrGarland =
    (lower.includes("ялинк") ||
      lower.includes("ялин") ||
      lower.includes("сосн") ||
      lower.includes("смерек") ||
      lower.includes("гірлянд") ||
      lower.includes("туя")) &&
    !lower.includes("куль") &&
    !lower.includes("фігур")

  if (!isTreeOrGarland) return null

  return product.name
    .replace(/\bялина\b/gi, "ялинка")
    .replace(/,?\s*\(?\d+[.,]?\d*\s*(м|см)\)?(?=\s|$|\))/gi, " ")
    .replace(/штучна\s+ялинка\s+лита/gi, "лита штучна ялинка")
    .replace(/саморозкладна\s+лита\s+штучна\s+ялинка/gi, "саморозкладна лита ялинка")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function groupCatalogModels(items: Product[]): Product[] {
  const groups = new Map<string, Product[]>()
  const result: Product[] = []
  const groupPlaceholders = new Map<string, number>()

  for (const item of items) {
    const key = getTreeModelKey(item)
    const heightInfo = extractHeightLabel(item.name)

    if (!key || !heightInfo) {
      result.push(item)
      continue
    }

    const existing = groups.get(key)
    if (!existing) {
      groups.set(key, [item])
      groupPlaceholders.set(key, result.length)
      result.push(item)
    } else {
      existing.push(item)
    }
  }

  for (const [key, members] of groups.entries()) {
    if (members.length <= 1) continue

    const sorted = [...members].sort((a, b) => {
      const ha = extractHeightLabel(a.name)?.meters ?? 999
      const hb = extractHeightLabel(b.name)?.meters ?? 999
      return ha - hb || a.price - b.price
    })

    // Prefer 1.8m or 2.1m as the default selected height on the card
    const preferred =
      sorted.find((p) => {
        const m = extractHeightLabel(p.name)?.meters
        return m === 1.8 && p.stock > 0
      }) ??
      sorted.find((p) => {
        const m = extractHeightLabel(p.name)?.meters
        return m === 2.1 && p.stock > 0
      }) ??
      sorted.find((p) => p.stock > 0) ??
      sorted[0]

    const variants = sorted.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      oldPrice: p.oldPrice ?? null,
      height: extractHeightLabel(p.name)?.label ?? p.name,
      inStock: p.stock > 0,
      isCurrent: p.id === preferred.id,
    }))

    const idx = groupPlaceholders.get(key)
    if (idx !== undefined) {
      result[idx] = {
        ...preferred,
        variants,
      }
    }
  }

  return result
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

  // Групуємо однакові моделі ялинок різної висоти в одну картку з перемикачем висот
  const groupedProducts = useMemo(() => {
    return groupCatalogModels(products)
  }, [products])

  // Поточна вибрана категорія
  const currentCategory = useMemo(() => {
    return selectedSlug ? findCategory(categories, selectedSlug) : null
  }, [categories, selectedSlug])

  // Підрахунок кількості товарів у кожній реальній категорії бази
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const cat of topCategories) {
      const ids = collectCategoryIds(cat)
      const count = groupedProducts.filter(
        (p) =>
          (p.categoryId ? ids.has(p.categoryId) : false) ||
          p.categorySlug === cat.slug ||
          (p.categoryName && p.categoryName.toLowerCase() === cat.name.toLowerCase())
      ).length
      map.set(cat.id, count)
    }
    return map
  }, [groupedProducts, topCategories])

  const currentTitle = useMemo(() => {
    if (!selectedSlug) return title
    return currentCategory ? formatCategoryName(currentCategory.name) : title
  }, [selectedSlug, title, currentCategory])

  // Динамічна фільтрація товарів за реальною категорією
  const displayedProducts = useMemo(() => {
    if (!selectedSlug) return groupedProducts

    if (currentCategory) {
      const ids = collectCategoryIds(currentCategory)
      const filtered = groupedProducts.filter(
        (p) =>
          (p.categoryId ? ids.has(p.categoryId) : false) ||
          p.categorySlug === selectedSlug ||
          (p.categoryName &&
            p.categoryName.toLowerCase() === currentCategory.name.toLowerCase())
      )
      return filtered.length > 0 ? filtered : groupedProducts
    }

    const filtered = groupedProducts.filter((p) => p.categorySlug === selectedSlug)
    return filtered.length > 0 ? filtered : groupedProducts
  }, [groupedProducts, selectedSlug, currentCategory])

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
    <section id="catalog" className="scroll-mt-24 pt-12 pb-16 sm:pt-16 sm:pb-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[#8C5E14] dark:text-[#D4AF37] uppercase">
            {eyebrow}
          </p>

          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.02em] sm:text-4xl text-foreground transition-all duration-300">
            {currentTitle}
          </h2>
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
              : "border-border/80 bg-card text-muted-foreground hover:border-[#D4AF37]/45 hover:text-foreground"
          )}
          aria-current={!selectedSlug ? "page" : undefined}
        >
          <span>Усі товари</span>
          <span className="ml-1.5 text-[10px] font-medium opacity-70">
            {groupedProducts.length}
          </span>
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
                  : "border-border/80 bg-card text-muted-foreground hover:border-[#D4AF37]/45 hover:text-foreground"
              )}
              aria-current={isCategoryActive ? "page" : undefined}
            >
              <span>{category.name}</span>
              <span className="ml-1.5 text-[10px] font-medium opacity-70">
                {count}
              </span>
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
          products={displayedProducts}
          searchQuery={searchQuery}
          itemListName={currentTitle}
        />
      </div>
    </section>
  )
}
