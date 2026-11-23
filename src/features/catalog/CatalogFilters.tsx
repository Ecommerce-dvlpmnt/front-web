"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getCatalogHref, type CatalogFilters as Filters } from "@/features/catalog/navigation"

interface Props {
  categorySlug?: string
  searchQuery?: string
  filters: Filters
}

export function CatalogFilters({ categorySlug, searchQuery, filters }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const readPrice = (key: string) => {
      const raw = String(data.get(key) ?? "").trim()
      if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return undefined
      const value = Number(raw)
      return value <= 10000000 ? value : undefined
    }
    const minPrice = readPrice("minPrice")
    const maxPrice = readPrice("maxPrice")
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      event.currentTarget.querySelector<HTMLInputElement>("[name=maxPrice]")?.setCustomValidity("Максимальна ціна має бути не меншою за мінімальну")
      event.currentTarget.reportValidity()
      return
    }
    const sort = String(data.get("sort") ?? "")
    const sortBy = sort === "price_asc" || sort === "price_desc" ? sort : undefined
    router.push(getCatalogHref({
      categorySlug, searchQuery, pageNumber: 1,
      filters: { sortBy, minPrice, maxPrice, inStock: data.has("inStock") },
    }).replace(/#catalog$/, ""), { scroll: false })
    setOpen(false)
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-3 sm:p-4">
      <Button type="button" variant="outline" className="w-full md:hidden" aria-expanded={open} aria-controls="catalog-filters" onClick={() => setOpen(!open)}>
        Фільтри та сортування
      </Button>
      <form id="catalog-filters" onSubmit={apply} className={`${open ? "grid" : "hidden"} mt-3 gap-3 md:mt-0 md:grid md:grid-cols-[minmax(10rem,1fr)_repeat(2,minmax(6rem,0.6fr))_auto_auto] md:items-end`}>
        <label className="grid gap-1 text-xs font-medium text-foreground">
          Сортування
          <select name="sort" defaultValue={filters.sortBy ?? "date_desc"} className="h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring">
            <option value="date_desc">За замовчуванням</option>
            <option value="price_asc">Від дешевших</option>
            <option value="price_desc">Від дорожчих</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-foreground">
          Ціна від, ₴
          <Input name="minPrice" type="number" min="0" max="10000000" step="0.01" defaultValue={filters.minPrice ?? ""} onChange={(event) => event.currentTarget.form?.querySelector<HTMLInputElement>("[name=maxPrice]")?.setCustomValidity("")} />
        </label>
        <label className="grid gap-1 text-xs font-medium text-foreground">
          Ціна до, ₴
          <Input name="maxPrice" type="number" min="0" max="10000000" step="0.01" defaultValue={filters.maxPrice ?? ""} onChange={(event) => event.currentTarget.setCustomValidity("")} />
        </label>
        <label className="flex min-h-10 items-center gap-2 text-sm text-foreground">
          <input name="inStock" type="checkbox" defaultChecked={filters.inStock} className="size-4 accent-foreground" />
          Тільки в наявності
        </label>
        <Button type="submit" className="min-h-10">Застосувати</Button>
      </form>
    </div>
  )
}
