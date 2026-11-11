"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import {
  Boxes,
  ImageOff,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react"

import { ProductForm } from "@/components/admin/products/ProductForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/formatters/price"
import type { Category } from "@/types/category"
import type { AdminProduct } from "@/types/product"
import type { Supplier } from "@/types/supplier"

interface ProductsAdminProps {
  initialProducts: AdminProduct[]
  categories: Category[]
  suppliers: Supplier[]
}

function getErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Не вдалося виконати операцію. Спробуйте ще раз."
  }

  const error = payload as {
    detail?: string
    title?: string
  }

  return error.detail ?? error.title ?? "Не вдалося виконати операцію."
}

function isAdminProduct(value: unknown): value is AdminProduct {
  if (!value || typeof value !== "object") return false

  const product = value as Partial<AdminProduct>

  return (
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.sku === "string" &&
    typeof product.price === "number" &&
    typeof product.dropPrice === "number" &&
    typeof product.stock === "number" &&
    typeof product.isActive === "boolean" &&
    typeof product.mainImageUrl === "string"
  )
}

export function ProductsAdmin({
  initialProducts,
  categories,
  suppliers,
}: ProductsAdminProps) {
  const [products, setProducts] = useState(initialProducts)
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [operationError, setOperationError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isFormOpen) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsFormOpen(false)
    }

    document.addEventListener("keydown", handleEscape)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [isFormOpen])

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories]
  )
  const supplierNames = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier.name])),
    [suppliers]
  )
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.sku.toLowerCase().includes(normalizedQuery)
      const matchesCategory =
        !categoryFilter || product.categoryId === categoryFilter
      const matchesSupplier =
        !supplierFilter || product.supplierId === supplierFilter

      return matchesQuery && matchesCategory && matchesSupplier
    })
  }, [categoryFilter, products, query, supplierFilter])

  function openCreateForm() {
    setEditingProduct(null)
    setOperationError(null)
    setStatusMessage(null)
    setIsFormOpen(true)
  }

  function openEditForm(product: AdminProduct) {
    setEditingProduct(product)
    setOperationError(null)
    setStatusMessage(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingProduct(null)
  }

  function handleSaved(product: AdminProduct) {
    setProducts((currentProducts) => {
      const exists = currentProducts.some((item) => item.id === product.id)

      return exists
        ? currentProducts.map((item) =>
            item.id === product.id ? product : item
          )
        : [product, ...currentProducts]
    })
    setStatusMessage(
      editingProduct ? "Дані товару оновлено." : "Товар додано."
    )
    closeForm()
  }

  async function handleDelete(product: AdminProduct) {
    const confirmed = window.confirm(`Видалити товар «${product.name}»?`)
    if (!confirmed) return

    setDeletingId(product.id)
    setOperationError(null)
    setStatusMessage(null)

    try {
      const response = await fetch(
        `/api/admin/products/${encodeURIComponent(product.id)}`,
        { method: "DELETE" }
      )
      const payload: unknown = await response.json().catch(() => null)

      if (!response.ok) throw new Error(getErrorMessage(payload))

      const refreshedResponse = await fetch(
        "/api/admin/products?onlyActive=false"
      )
      const refreshedPayload: unknown = await refreshedResponse
        .json()
        .catch(() => null)

      if (
        refreshedResponse.ok &&
        Array.isArray(refreshedPayload) &&
        refreshedPayload.every(isAdminProduct)
      ) {
        setProducts(refreshedPayload)
      } else {
        setProducts((currentProducts) =>
          currentProducts.filter((item) => item.id !== product.id)
        )
      }

      setStatusMessage("Товар видалено або деактивовано.")
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "Не вдалося видалити товар."
      )
    } finally {
      setDeletingId(null)
    }
  }

  const activeProducts = products.filter((product) => product.isActive).length
  const lowStockProducts = products.filter(
    (product) => product.isActive && product.stock > 0 && product.stock <= 5
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Адміністрування</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Товари</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Керуйте асортиментом, цінами, залишками та зв’язками з каталогом.
          </p>
        </div>

        <Button onClick={openCreateForm}>
          <Plus />
          Додати товар
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="size-4" /> Усього
          </div>
          <p className="mt-2 text-2xl font-semibold">{products.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" /> Активні
          </div>
          <p className="mt-2 text-2xl font-semibold">{activeProducts}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Boxes className="size-4" /> Мало на складі
          </div>
          <p className="mt-2 text-2xl font-semibold">{lowStockProducts}</p>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пошук за назвою або SKU..."
            aria-label="Пошук товарів за назвою або SKU"
            className="pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
          aria-label="Фільтр товарів за категорією"
        >
          <option value="">Усі категорії</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={supplierFilter}
          onChange={(event) => setSupplierFilter(event.target.value)}
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
          aria-label="Фільтр товарів за постачальником"
        >
          <option value="">Усі постачальники</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </div>

      {(operationError || statusMessage) && (
        <p
          className={
            operationError
              ? "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              : "rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
          }
          role={operationError ? "alert" : "status"}
        >
          {operationError ?? statusMessage}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {filteredProducts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Package className="mx-auto size-9 text-muted-foreground" />
            <h2 className="mt-4 font-medium">
              {products.length === 0 ? "Товарів ще немає" : "Нічого не знайдено"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {products.length === 0
                ? "Додайте перший товар, щоб почати роботу з асортиментом."
                : "Змініть пошуковий запит або фільтри."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] text-left text-sm">
              <caption className="sr-only">Таблиця товарів</caption>
              <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Товар</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Категорія</th>
                  <th className="px-4 py-3 font-medium">Постачальник</th>
                  <th className="px-4 py-3 font-medium">Ціна</th>
                  <th className="px-4 py-3 font-medium">Стара ціна</th>
                  <th className="px-4 py-3 font-medium">Дроп-ціна</th>
                  <th className="px-4 py-3 font-medium">Маржа</th>
                  <th className="px-4 py-3 font-medium">Залишок</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 text-right font-medium">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => {
                  const margin = product.price - product.dropPrice

                  return (
                    <tr
                      key={product.id}
                      className="align-middle transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex min-w-56 items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                            {product.mainImageUrl === "/product-placeholder.svg" ? (
                              <ImageOff
                                className="absolute inset-0 m-auto size-5 text-muted-foreground"
                                aria-hidden="true"
                              />
                            ) : (
                              <Image
                                src={product.mainImageUrl}
                                alt=""
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <span className="line-clamp-2 font-medium">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {product.sku || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {product.categoryName || categoryNames.get(product.categoryId) || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Truck className="size-3.5" aria-hidden="true" />
                          {supplierNames.get(product.supplierId) || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {product.oldPrice != null
                          ? formatPrice(product.oldPrice)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatPrice(product.dropPrice)}
                      </td>
                      <td
                        className={`px-4 py-3 font-medium ${
                          margin >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-destructive"
                        }`}
                      >
                        {formatPrice(margin)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            product.stock <= 5
                              ? "font-medium text-amber-700 dark:text-amber-300"
                              : undefined
                          }
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={product.isActive ? "secondary" : "outline"}
                        >
                          {product.isActive ? "Активний" : "Неактивний"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Редагувати ${product.name}`}
                            onClick={() => openEditForm(product)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Видалити ${product.name}`}
                            disabled={deletingId === product.id}
                            onClick={() => handleDelete(product)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm()
          }}
        >
          <div
            className="flex max-h-[min(900px,100dvh)] min-h-[min(680px,100dvh)] w-full max-w-3xl flex-col overflow-hidden bg-background shadow-2xl sm:rounded-2xl sm:border sm:border-border"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-border px-6 py-5">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Каталог
                </p>
                <h2 id="product-form-title" className="mt-1 text-xl font-semibold">
                  {editingProduct ? "Редагувати товар" : "Новий товар"}
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Закрити форму"
                onClick={closeForm}
              >
                <X />
              </Button>
            </div>

            <ProductForm
              product={editingProduct}
              categories={categories}
              onCancel={closeForm}
              onSaved={handleSaved}
            />
          </div>
        </div>
      )}
    </div>
  )
}
