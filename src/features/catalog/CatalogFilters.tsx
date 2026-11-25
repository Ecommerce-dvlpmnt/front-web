"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getCatalogHref, type CatalogFilters as Filters } from "@/features/catalog/navigation"

interface Props {
  categorySlug?: string
  searchQuery?: string
  filters: Filters
}

const quickPrices = [
  { label: "До 1 500 ₴", min: "", max: "1500" },
  { label: "1 500–4 000 ₴", min: "1500", max: "4000" },
  { label: "Від 4 000 ₴", min: "4000", max: "" },
]

function parsePrice(raw: string): number | undefined {
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw.trim())) return undefined
  const value = Number(raw)
  return Number.isFinite(value) && value <= 10000000 ? value : undefined
}

export function CatalogFilters({ categorySlug, searchQuery = "", filters }: Props) {
  const router = useRouter()
  // Keep typing independent of server props. This component lives outside the keyed results boundary.
  const [searchTerm, setSearchTerm] = useState(searchQuery)
  const [active, setActive] = useState<Filters>(filters)
  const [minDraft, setMinDraft] = useState(filters.minPrice?.toString() ?? "")
  const [maxDraft, setMaxDraft] = useState(filters.maxPrice?.toString() ?? "")
  const [priceError, setPriceError] = useState("")
  const [openDropdown, setOpenDropdown] = useState<"sort" | "price" | null>(null)
  const sortMenu = useRef<HTMLDetailsElement>(null)
  const priceMenu = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    if (!openDropdown) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!sortMenu.current?.contains(target) && !priceMenu.current?.contains(target)) {
        setOpenDropdown(null)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdown(null)
        const menu = openDropdown === "sort" ? sortMenu.current : priceMenu.current
        menu?.querySelector("summary")?.focus()
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [openDropdown])

  const navigate = useCallback((query: string, next: Filters) => {
    const target = getCatalogHref({ categorySlug, searchQuery: query.trim(), filters: next, pageNumber: 1 }).replace(/#catalog$/, "")
    router.replace(target, { scroll: false })
  }, [categorySlug, router])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if ((new URLSearchParams(window.location.search).get("query") ?? "") !== searchTerm.trim()) {
        navigate(searchTerm, active)
      }
    }, 400)
    return () => window.clearTimeout(timeout)
  }, [searchTerm, active, navigate])

  useEffect(() => {
    const reset = () => {
      setSearchTerm("")
      setActive({})
      setMinDraft("")
      setMaxDraft("")
      setPriceError("")
      setOpenDropdown(null)
      navigate("", {})
    }
    window.addEventListener("catalog-reset", reset)
    return () => window.removeEventListener("catalog-reset", reset)
  }, [navigate])

  function updateFilters(next: Filters) {
    setActive(next)
    navigate(searchTerm, next)
  }

  function applyPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const minPrice = parsePrice(minDraft)
    const maxPrice = parsePrice(maxDraft)
    if ((minDraft && minPrice === undefined) || (maxDraft && maxPrice === undefined)) {
      setPriceError("Введіть коректну ціну")
      return
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      setPriceError("Ціна «До» має бути більшою за «Від»")
      return
    }
    setPriceError("")
    updateFilters({ ...active, minPrice, maxPrice })
    setOpenDropdown(null)
  }

  const sortLabel = active.sortBy === "price_asc" ? "Спочатку дешевші" : active.sortBy === "price_desc" ? "Спочатку дорожчі" : "За замовчуванням"
  const priceLabel = active.minPrice !== undefined || active.maxPrice !== undefined
    ? `Ціна: ${active.minPrice ?? 0} – ${active.maxPrice ?? "∞"} ₴` : "Ціна, ₴"

  return (
    <div className="relative z-20 grid grid-cols-2 gap-2.5 rounded-2xl border border-border/60 bg-card p-3 shadow-sm dark:bg-[#14241D] sm:gap-3 sm:p-4 lg:flex lg:items-center">
      <form role="search" className="relative col-span-2 min-w-0 lg:flex-1" onSubmit={(event) => { event.preventDefault(); navigate(searchTerm, active) }}>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Пошук товарів…" aria-label="Пошук товарів" className="h-11 rounded-full border-border/70 bg-background pl-10 pr-10 text-sm focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60" />
        {searchTerm && <button type="button" aria-label="Очистити пошук" className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { setSearchTerm(""); navigate("", active) }}><X className="size-4" aria-hidden="true" /></button>}
      </form>

      <details ref={sortMenu} open={openDropdown === "sort"} className="group relative z-30 min-w-0 lg:w-48 lg:shrink-0">
        <summary onClick={(event) => { event.preventDefault(); setOpenDropdown((current) => current === "sort" ? null : "sort") }} className="flex h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-full border border-border/70 bg-background px-4 text-xs font-medium text-foreground hover:border-[#D4AF37]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <span className="truncate">{sortLabel}</span><ChevronDown className="size-4 shrink-0 text-[#8C5E14] transition-transform group-open:rotate-180 dark:text-[#D4AF37]" aria-hidden="true" />
        </summary>
        <div className="absolute left-0 top-full z-40 mt-2 w-56 rounded-xl border border-border bg-popover p-1.5 shadow-xl">
          {([ ["date_desc", "За замовчуванням"], ["price_asc", "Спочатку дешевші"], ["price_desc", "Спочатку дорожчі"] ] as const).map(([value, label]) => (
            <button key={value} type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-popover-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-current={(active.sortBy ?? "date_desc") === value ? "true" : undefined} onClick={() => { updateFilters({ ...active, sortBy: value === "date_desc" ? undefined : value }); setOpenDropdown(null) }}>{label}</button>
          ))}
        </div>
      </details>

      <details ref={priceMenu} open={openDropdown === "price"} className="group relative z-30 min-w-0 lg:shrink-0">
        <summary onClick={(event) => { event.preventDefault(); setOpenDropdown((current) => current === "price" ? null : "price") }} className="flex h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-full border border-border/70 bg-background px-4 text-xs font-medium text-foreground hover:border-[#D4AF37]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <span className="truncate">{priceLabel}</span><ChevronDown className="size-4 shrink-0 text-[#8C5E14] transition-transform group-open:rotate-180 dark:text-[#D4AF37]" aria-hidden="true" />
        </summary>
        <form onSubmit={applyPrice} className="absolute right-0 top-full z-40 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-xl">
          <p className="mb-3 text-sm font-semibold">Діапазон цін</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs text-muted-foreground">Від<Input type="number" min="0" max="10000000" step="0.01" value={minDraft} onChange={(event) => { setMinDraft(event.target.value); setPriceError("") }} placeholder="0" className="h-10 bg-background" /></label>
            <label className="grid gap-1 text-xs text-muted-foreground">До<Input type="number" min="0" max="10000000" step="0.01" value={maxDraft} onChange={(event) => { setMaxDraft(event.target.value); setPriceError("") }} placeholder="∞" className="h-10 bg-background" /></label>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">{quickPrices.map((option) => <button key={option.label} type="button" className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-[#D4AF37]/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { setMinDraft(option.min); setMaxDraft(option.max); setPriceError("") }}>{option.label}</button>)}</div>
          {priceError && <p className="mt-2 text-xs text-destructive" role="alert">{priceError}</p>}
          <div className="mt-4 flex items-center justify-between gap-2">
            <button type="button" className="text-xs text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { setMinDraft(""); setMaxDraft(""); setPriceError(""); updateFilters({ ...active, minPrice: undefined, maxPrice: undefined }); setOpenDropdown(null) }}>Скинути</button>
            <Button type="submit" size="sm" className="rounded-full px-5">Ок</Button>
          </div>
        </form>
      </details>

      <button type="button" role="switch" aria-checked={Boolean(active.inStock)} className="col-span-2 inline-flex min-h-11 items-center justify-between gap-3 rounded-full border border-border/70 bg-background px-4 py-2.5 pr-3 text-xs font-medium text-foreground hover:border-[#D4AF37]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-1 lg:shrink-0" onClick={() => updateFilters({ ...active, inStock: !active.inStock })}>
        Тільки в наявності
        <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${active.inStock ? "bg-[#D9A73E]" : "bg-foreground/15"}`} aria-hidden="true">
          <span className={`pointer-events-none block h-5 w-5 rounded-full ${active.inStock ? "bg-[#0E1512] translate-x-5" : "bg-white translate-x-0"} shadow-sm transition-transform duration-200`} />
        </span>
      </button>
    </div>
  )
}
