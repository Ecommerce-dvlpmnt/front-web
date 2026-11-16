"use client"

import { useEffect, useMemo, useState } from "react"
import { MapPin, Plus, Search, Users, X } from "lucide-react"

import { SupplierForm } from "@/components/admin/suppliers/SupplierForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Supplier } from "@/types/supplier"

interface SuppliersAdminProps {
  initialSuppliers: Supplier[]
}

type StatusFilter = "all" | "active"

export function SuppliersAdmin({
  initialSuppliers,
}: SuppliersAdminProps) {
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
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

  const filteredSuppliers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return suppliers.filter((supplier) => {
      const matchesStatus =
        statusFilter === "all" || supplier.isActive
      const matchesQuery =
        !normalizedQuery ||
        supplier.name.toLowerCase().includes(normalizedQuery) ||
        supplier.city.toLowerCase().includes(normalizedQuery)

      return matchesStatus && matchesQuery
    })
  }, [query, statusFilter, suppliers])

  function openCreateForm() {
    setOperationError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
  }

  function handleSaved(supplier: Supplier) {
    setSuppliers((currentSuppliers) => {
      return [supplier, ...currentSuppliers]
    })
    setStatusMessage("Постачальника додано.")
    closeForm()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Адміністрування</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Постачальники
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Керуйте контактами, містами відправлення та умовами співпраці.
          </p>
        </div>

        <Button onClick={openCreateForm}>
          <Plus />
          Додати постачальника
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" /> Усього
          </div>
          <p className="mt-2 text-2xl font-semibold">{suppliers.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" /> Активні
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {suppliers.filter((supplier) => supplier.isActive).length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" /> Міста
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {new Set(suppliers.map((supplier) => supplier.city)).size}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пошук за назвою або містом..."
            aria-label="Пошук постачальників за назвою або містом"
            className="pl-9"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Статус</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
            aria-label="Фільтр за статусом"
          >
            <option value="all">Усі</option>
            <option value="active">Тільки активні</option>
          </select>
        </label>
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
        {filteredSuppliers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto size-9 text-muted-foreground" />
            <h2 className="mt-4 font-medium">
              {suppliers.length === 0
                ? "Постачальників ще немає"
                : "Нічого не знайдено"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {suppliers.length === 0
                ? "Додайте першого постачальника, щоб почати роботу."
                : "Змініть запит або фільтр статусу."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Назва</th>
                  <th className="px-4 py-3 font-medium">Контакт</th>
                  <th className="px-4 py-3 font-medium">Місто</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="max-w-xs px-4 py-3 font-medium">Нотатки</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="align-top transition-colors hover:bg-muted/30">
                    <td className="px-4 py-4 font-medium">{supplier.name}</td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {supplier.contact}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {supplier.city}
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        variant={supplier.isActive ? "secondary" : "outline"}
                      >
                        {supplier.isActive ? "Активний" : "Неактивний"}
                      </Badge>
                    </td>
                    <td className="max-w-xs px-4 py-4 text-muted-foreground">
                      <span className="line-clamp-2">
                        {supplier.notes || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
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
            className="flex max-h-[min(760px,100dvh)] min-h-[min(620px,100dvh)] w-full max-w-xl flex-col overflow-hidden bg-background shadow-2xl sm:rounded-2xl sm:border sm:border-border"
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-form-title"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-border px-6 py-5">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Постачальник
                </p>
                <h2 id="supplier-form-title" className="mt-1 text-xl font-semibold">
                  Новий постачальник
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

            <SupplierForm
              onCancel={closeForm}
              onSaved={handleSaved}
            />
          </div>
        </div>
      )}
    </div>
  )
}
