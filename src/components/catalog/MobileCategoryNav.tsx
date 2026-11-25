"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { ChevronDown, LayoutGrid } from "lucide-react"

import { getCatalogHref, type CatalogFilters } from "@/features/catalog/navigation"
import { formatCategoryName } from "@/lib/formatters/category"
import { cn } from "@/lib/utils"
import type { CategoryTreeNode } from "@/types/category"

interface Props {
  categories: CategoryTreeNode[]
  activeCategorySlug?: string
  searchQuery?: string
  filters: CatalogFilters
}

function flattenCategories(categories: CategoryTreeNode[]): CategoryTreeNode[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children)])
}

export function MobileCategoryNav({ categories, activeCategorySlug, searchQuery, filters }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const allCategories = flattenCategories(categories)
  const activeCategory = allCategories.find((category) => category.slug === activeCategorySlug)
  const href = (slug?: string) => getCatalogHref({ categorySlug: slug, searchQuery, filters })

  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
        rootRef.current?.querySelector("button")?.focus()
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={rootRef} className="mt-8 space-y-3 md:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-[#D4AF37]/40 bg-card px-4 py-2.5 text-left text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-[#D4AF37]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] dark:bg-[#14241D]"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <LayoutGrid className="size-4 shrink-0 text-[#A0772D] dark:text-[#F3D078]" aria-hidden="true" />
          <span>Категорії</span>
          {activeCategory && <span className="truncate text-xs font-medium text-[#8C5E14] dark:text-[#F3D078]">· {formatCategoryName(activeCategory.name)}</span>}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
      </button>

      <nav id={panelId} aria-label="Усі категорії каталогу" className={cn("grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-3 shadow-lg dark:bg-[#14241D]", !isOpen && "hidden")}>
          <Link href={href()} prefetch={false} onClick={() => setIsOpen(false)} aria-current={!activeCategorySlug ? "page" : undefined} className={cn("rounded-xl px-3 py-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]", !activeCategorySlug ? "bg-[#163F31] text-[#F3D078]" : "bg-background text-foreground hover:bg-muted")}>
            Усі товари
          </Link>
          {allCategories.map((category) => (
            <Link key={category.id} href={href(category.slug)} prefetch={false} onClick={() => setIsOpen(false)} aria-current={category.slug === activeCategorySlug ? "page" : undefined} className={cn("rounded-xl px-3 py-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]", category.slug === activeCategorySlug ? "bg-[#163F31] text-[#F3D078]" : "bg-background text-foreground hover:bg-muted")}>
              {formatCategoryName(category.name)}
            </Link>
          ))}
      </nav>

    </div>
  )
}
