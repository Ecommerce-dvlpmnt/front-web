"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { Boxes, ChevronLeft, ChevronRight, ExternalLink, ImageOff, Package, Pencil, Plus, RotateCcw, Search, Trash2, Truck, X } from "lucide-react"

import { ProductForm } from "@/components/admin/products/ProductForm"
import { ImageLightbox } from "@/components/ui/ImageLightbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getProductGalleryImages, type ProductGalleryImage } from "@/features/product/product-utils"
import { formatPrice } from "@/lib/formatters/price"
import type { AdminProductPage } from "@/lib/api/admin/products"
import type { Category } from "@/types/category"
import type { AdminProduct } from "@/types/product"
import type { Supplier } from "@/types/supplier"

interface ProductsAdminProps {
  initialPage: AdminProductPage
  initialError?: string | null
  categories: Category[]
  suppliers: Supplier[]
}

const COLUMNS = [
  { key: "product", label: "Товар", width: 300, min: 220 },
  { key: "sku", label: "SKU", width: 125, min: 90 },
  { key: "category", label: "Категорія", width: 160, min: 100 },
  { key: "supplier", label: "Постачальник", width: 165, min: 110 },
  { key: "price", label: "Ціна", width: 115, min: 90 },
  { key: "oldPrice", label: "Стара ціна", width: 115, min: 90 },
  { key: "dropPrice", label: "Дроп-ціна", width: 115, min: 90 },
  { key: "margin", label: "Маржа", width: 110, min: 90 },
  { key: "stock", label: "Залишок", width: 95, min: 75 },
  { key: "status", label: "Статус", width: 115, min: 90 },
  { key: "actions", label: "Дії", width: 105, min: 90 },
] as const
type ColumnKey = (typeof COLUMNS)[number]["key"]
type ColumnWidths = Record<ColumnKey, number>
const DEFAULT_WIDTHS = Object.fromEntries(COLUMNS.map((column) => [column.key, column.width])) as ColumnWidths
const WIDTH_STORAGE_KEY = "admin-products-column-widths-v1"

function getErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return "Не вдалося виконати операцію. Спробуйте ще раз."
  const error = payload as { detail?: string; title?: string }
  return error.detail ?? error.title ?? "Не вдалося виконати операцію."
}

function isAdminProduct(value: unknown): value is AdminProduct {
  if (!value || typeof value !== "object") return false
  const product = value as Partial<AdminProduct>
  return typeof product.id === "string" && typeof product.name === "string" &&
    typeof product.sku === "string" && typeof product.price === "number" &&
    typeof product.dropPrice === "number" && typeof product.stock === "number" &&
    typeof product.isActive === "boolean" && typeof product.mainImageUrl === "string"
}

function isAdminProductPage(value: unknown): value is AdminProductPage {
  if (!value || typeof value !== "object") return false
  const page = value as Partial<AdminProductPage>
  return Array.isArray(page.items) && page.items.every(isAdminProduct) &&
    typeof page.totalCount === "number" && typeof page.totalPages === "number" &&
    typeof page.pageNumber === "number" && typeof page.pageSize === "number"
}

export function ProductsAdmin({ initialPage, initialError = null, categories, suppliers }: ProductsAdminProps) {
  const [pageData, setPageData] = useState(initialPage)
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("")
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [reloadKey, setReloadKey] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [operationError, setOperationError] = useState<string | null>(initialError)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ images: ProductGalleryImage[]; index: number } | null>(null)
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(DEFAULT_WIDTHS)
  const lastFetchKey = useRef<string | null>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WIDTH_STORAGE_KEY) ?? "null") as Record<string, unknown> | null
      if (!saved) return
      const widths = Object.fromEntries(COLUMNS.map((column) => [column.key,
        typeof saved[column.key] === "number" && Number.isFinite(saved[column.key])
          ? Math.max(column.min, Math.min(800, saved[column.key] as number)) : column.width])) as ColumnWidths
      const frame = requestAnimationFrame(() => setColumnWidths(widths))
      return () => cancelAnimationFrame(frame)
    } catch { /* Ignore corrupt local preferences. */ }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { setPageNumber(1); setSearch(query.trim()) }, 350)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const fetchKey = JSON.stringify([categoryFilter, pageNumber, pageSize, search, supplierFilter, reloadKey])
    if (lastFetchKey.current === null) { lastFetchKey.current = fetchKey; return }
    if (query.trim() !== search) return
    if (lastFetchKey.current === fetchKey) return
    lastFetchKey.current = fetchKey
    const controller = new AbortController()
    const params = new URLSearchParams({ onlyActive: "false", pageNumber: String(pageNumber), pageSize: String(pageSize) })
    if (search) params.set("search", search)
    if (categoryFilter) params.set("categoryId", categoryFilter)
    if (supplierFilter) params.set("supplierId", supplierFilter)
    void (async () => {
      setIsLoading(true)
      setOperationError(null)
      try {
        const response = await fetch(`/api/admin/products?${params}`, { signal: controller.signal })
        const payload: unknown = await response.json().catch(() => null)
        if (!response.ok) throw new Error(getErrorMessage(payload))
        if (!isAdminProductPage(payload)) throw new Error("Некоректна відповідь списку товарів")
        if (pageNumber > Math.max(1, payload.totalPages)) {
          setPageNumber(Math.max(1, payload.totalPages))
          return
        }
        setPageData(payload)
      } catch (error) {
        if (!controller.signal.aborted) setOperationError(error instanceof Error ? error.message : "Не вдалося завантажити товари")
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    })()
    return () => controller.abort()
  }, [categoryFilter, pageNumber, pageSize, query, reloadKey, search, supplierFilter])

  useEffect(() => {
    if (!isFormOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("[data-image-lightbox]")) setIsFormOpen(false)
    }
    document.addEventListener("keydown", onEscape)
    return () => { document.removeEventListener("keydown", onEscape); document.body.style.overflow = previousOverflow }
  }, [isFormOpen])

  const categoryNames = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories])
  const supplierNames = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier.name])), [suppliers])
  const activeOnPage = pageData.items.filter((product) => product.isActive).length
  const lowStockOnPage = pageData.items.filter((product) => product.isActive && product.stock > 0 && product.stock <= 5).length
  const totalWidth = COLUMNS.reduce((sum, column) => sum + columnWidths[column.key], 0)
  const totalPages = Math.max(1, pageData.totalPages)
  const pageButtons = [...new Set([1, pageNumber - 1, pageNumber, pageNumber + 1, totalPages].filter((page) => page >= 1 && page <= totalPages))].sort((a, b) => a - b)
  const firstShown = pageData.totalCount === 0 ? 0 : (pageData.pageNumber - 1) * pageData.pageSize + 1
  const lastShown = Math.min(pageData.totalCount, firstShown + pageData.items.length - 1)

  function setWidth(key: ColumnKey, width: number) {
    const column = COLUMNS.find((item) => item.key === key)!
    setColumnWidths((current) => ({ ...current, [key]: Math.max(column.min, Math.min(800, width)) }))
  }

  function startResize(event: React.PointerEvent<HTMLSpanElement>, key: ColumnKey) {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = columnWidths[key]
    const column = COLUMNS.find((item) => item.key === key)!
    let finalWidth = startWidth
    const onMove = (move: PointerEvent) => { finalWidth = Math.max(column.min, Math.min(800, startWidth + move.clientX - startX)); setWidth(key, finalWidth) }
    const onUp = () => { localStorage.setItem(WIDTH_STORAGE_KEY, JSON.stringify({ ...columnWidths, [key]: finalWidth })); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp) }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp, { once: true })
  }

  function resizeByKeyboard(key: ColumnKey, delta: number) {
    const column = COLUMNS.find((item) => item.key === key)!
    const next = { ...columnWidths, [key]: Math.max(column.min, Math.min(800, columnWidths[key] + delta)) }
    setColumnWidths(next)
    localStorage.setItem(WIDTH_STORAGE_KEY, JSON.stringify(next))
  }

  function openCreateForm() { setEditingProduct(null); setOperationError(null); setStatusMessage(null); setIsFormOpen(true) }
  function openEditForm(product: AdminProduct) { setEditingProduct(product); setOperationError(null); setStatusMessage(null); setIsFormOpen(true) }
  function closeForm() { setIsFormOpen(false); setEditingProduct(null) }
  function handleSaved() {
    setStatusMessage(editingProduct ? "Дані товару оновлено." : "Товар додано.")
    if (!editingProduct) setPageNumber(1)
    closeForm()
    setReloadKey((value) => value + 1)
  }

  async function handleDelete(product: AdminProduct) {
    if (!window.confirm(`Видалити товар «${product.name}»?`)) return
    setDeletingId(product.id)
    setOperationError(null)
    setStatusMessage(null)
    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: "DELETE" })
      if (!response.ok) throw new Error(getErrorMessage(await response.json().catch(() => null)))
      setStatusMessage("Товар видалено або деактивовано.")
      setReloadKey((value) => value + 1)
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "Не вдалося видалити товар")
    } finally { setDeletingId(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm text-muted-foreground">Адміністрування</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Товари</h1><p className="mt-2 text-sm text-muted-foreground">Керуйте асортиментом, цінами та залишками.</p></div>
        <Button onClick={openCreateForm}><Plus />Додати товар</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4"><p className="flex items-center gap-2 text-sm text-muted-foreground"><Package className="size-4" />Усього за фільтром</p><p className="mt-2 text-2xl font-semibold">{pageData.totalCount}</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><p className="flex items-center gap-2 text-sm text-muted-foreground"><span className="size-2 rounded-full bg-emerald-500" />Активні на сторінці</p><p className="mt-2 text-2xl font-semibold">{activeOnPage}</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><p className="flex items-center gap-2 text-sm text-muted-foreground"><Boxes className="size-4" />Мало на сторінці</p><p className="mt-2 text-2xl font-semibold">{lowStockOnPage}</p></div>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
        <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук за назвою або SKU..." aria-label="Пошук товарів за назвою або SKU" className="pl-9" /></div>
        <select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPageNumber(1) }} className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Фільтр товарів за категорією"><option value="">Усі категорії</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
        <select value={supplierFilter} onChange={(event) => { setSupplierFilter(event.target.value); setPageNumber(1) }} className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Фільтр товарів за постачальником"><option value="">Усі постачальники</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select>
      </div>

      {(operationError || statusMessage) && <p role={operationError ? "alert" : "status"} className={operationError ? "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" : "rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"}>{operationError ?? statusMessage}</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm">
          <span className="text-muted-foreground">Показано {firstShown}–{Math.max(0, lastShown)} із {pageData.totalCount}{isLoading && <span className="ml-2" role="status">Оновлення…</span>}</span>
          <div className="flex items-center gap-3"><label className="flex items-center gap-2 text-muted-foreground">На сторінці <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPageNumber(1) }} className="rounded-md border border-input bg-background px-2 py-1 text-foreground focus-visible:ring-2 focus-visible:ring-ring"><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></label><Button type="button" size="sm" variant="ghost" onClick={() => { setColumnWidths(DEFAULT_WIDTHS); localStorage.removeItem(WIDTH_STORAGE_KEY) }}><RotateCcw className="size-4" />Скинути ширину</Button></div>
        </div>
        {pageData.items.length === 0 ? (
          <div className="px-6 py-16 text-center"><Package className="mx-auto size-9 text-muted-foreground" /><h2 className="mt-4 font-medium">{pageData.totalCount === 0 && !search && !categoryFilter && !supplierFilter ? "Товарів ще немає" : "Нічого не знайдено"}</h2><p className="mt-2 text-sm text-muted-foreground">Спробуйте змінити пошук або фільтри.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-fixed text-left text-sm" style={{ width: totalWidth, minWidth: "100%" }}>
              <caption className="sr-only">Таблиця товарів</caption>
              <colgroup>{COLUMNS.map((column) => <col key={column.key} style={{ width: columnWidths[column.key] }} />)}</colgroup>
              <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground"><tr>{COLUMNS.map((column) => <th key={column.key} scope="col" className="relative px-3 py-3 font-medium"><span className="block truncate">{column.label}</span><span role="separator" aria-orientation="vertical" aria-label={`Змінити ширину: ${column.label}`} tabIndex={0} onPointerDown={(event) => startResize(event, column.key)} onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); resizeByKeyboard(column.key, event.key === "ArrowRight" ? 10 : -10) } }} className="absolute inset-y-0 right-0 w-2 cursor-col-resize border-r border-transparent hover:border-primary focus-visible:outline-none focus-visible:border-primary" /></th>)}</tr></thead>
              <tbody className="divide-y divide-border">{pageData.items.map((product) => {
                const margin = product.price - product.dropPrice
                const images = getProductGalleryImages(product).filter((image) => image.src !== "/product-placeholder.svg")
                return <tr key={product.id} className="align-middle transition-colors hover:bg-muted/30">
                  <td className="px-3 py-3"><div className="flex min-w-0 items-center gap-3"><button type="button" disabled={images.length === 0} onClick={() => setLightbox({ images, index: 0 })} aria-label={`Переглянути фото товару ${product.name}`} className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default">{images.length ? <Image src={images[0].src} alt="" fill sizes="48px" loading="lazy" className="object-cover" /> : <ImageOff className="absolute inset-0 m-auto size-5 text-muted-foreground" aria-hidden="true" />}</button><Link href={`/product/${encodeURIComponent(product.slug)}`} target="_blank" rel="noopener noreferrer" prefetch={false} className="group min-w-0 rounded-sm font-medium text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"><span className="flex items-start gap-1"><span className="line-clamp-2 break-words">{product.name}</span><ExternalLink className="mt-0.5 size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true" /></span></Link></div></td>
                  <td className="truncate px-3 py-3 font-mono text-xs text-muted-foreground" title={product.sku}>{product.sku || "—"}</td>
                  <td className="truncate px-3 py-3 text-muted-foreground" title={product.categoryName || categoryNames.get(product.categoryId) || ""}>{product.categoryName || categoryNames.get(product.categoryId) || "—"}</td>
                  <td className="truncate px-3 py-3 text-muted-foreground" title={supplierNames.get(product.supplierId) || ""}><Truck className="mr-1 inline size-3.5" aria-hidden="true" />{supplierNames.get(product.supplierId) || "—"}</td>
                  <td className="truncate px-3 py-3 font-medium">{formatPrice(product.price)}</td>
                  <td className="truncate px-3 py-3 text-muted-foreground">{product.oldPrice != null ? formatPrice(product.oldPrice) : "—"}</td>
                  <td className="truncate px-3 py-3 text-muted-foreground">{formatPrice(product.dropPrice)}</td>
                  <td className={`truncate px-3 py-3 font-medium ${margin >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-destructive"}`}>{formatPrice(margin)}</td>
                  <td className={`px-3 py-3 ${product.stock <= 5 ? "font-medium text-amber-700 dark:text-amber-300" : ""}`}>{product.stock}</td>
                  <td className="px-3 py-3"><Badge variant={product.isActive ? "secondary" : "outline"}>{product.isActive ? "Активний" : "Неактивний"}</Badge></td>
                  <td className="px-2 py-3"><div className="flex justify-end gap-1"><Button type="button" variant="ghost" size="icon" aria-label={`Редагувати ${product.name}`} onClick={() => openEditForm(product)}><Pencil className="size-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Видалити ${product.name}`} disabled={deletingId === product.id} onClick={() => handleDelete(product)}><Trash2 className="size-4" /></Button></div></td>
                </tr>
              })}</tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm"><span className="text-muted-foreground">Сторінка {pageNumber} із {totalPages}</span><nav aria-label="Сторінки товарів" className="flex items-center gap-1"><Button type="button" variant="outline" size="sm" disabled={pageNumber <= 1 || isLoading} onClick={() => setPageNumber((page) => page - 1)}><ChevronLeft className="size-4" />Назад</Button>{pageButtons.map((page, index) => <span key={page} className="inline-flex items-center gap-1">{index > 0 && page - pageButtons[index - 1] > 1 && <span aria-hidden="true">…</span>}<Button type="button" variant={page === pageNumber ? "default" : "ghost"} size="sm" aria-label={`Сторінка ${page}`} aria-current={page === pageNumber ? "page" : undefined} disabled={isLoading} onClick={() => setPageNumber(page)}>{page}</Button></span>)}<Button type="button" variant="outline" size="sm" disabled={pageNumber >= totalPages || isLoading} onClick={() => setPageNumber((page) => page + 1)}>Вперед<ChevronRight className="size-4" /></Button></nav></div>
      </div>

      {isFormOpen && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm() }}><div role="dialog" aria-modal="true" aria-labelledby="product-form-title" className="flex max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-background text-foreground shadow-2xl sm:max-h-[92dvh] sm:rounded-2xl sm:border sm:border-border"><div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-border bg-background px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Каталог</p><h2 id="product-form-title" className="mt-1 text-xl font-semibold">{editingProduct ? "Редагувати товар" : "Новий товар"}</h2></div><Button type="button" variant="ghost" size="icon" aria-label="Закрити форму" onClick={closeForm}><X /></Button></div><ProductForm product={editingProduct} categories={categories} suppliers={suppliers} onCancel={closeForm} onSaved={handleSaved} /></div></div>}
      {lightbox && <ImageLightbox images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />}
    </div>
  )
}
