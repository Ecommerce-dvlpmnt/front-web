"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  supplierSchema,
  toSupplierInput,
  type SupplierFormValues,
} from "@/features/admin/suppliers/supplier-schema"
import type { Supplier } from "@/types/supplier"

interface SupplierFormProps {
  supplier?: Supplier | null
  onCancel: () => void
  onSaved: (supplier: Supplier) => void
}

const emptyValues: SupplierFormValues = {
  name: "",
  contact: "",
  city: "",
  notes: "",
  isActive: true,
}

function getFormValues(supplier?: Supplier | null): SupplierFormValues {
  if (!supplier) return { ...emptyValues }

  return {
    name: supplier.name,
    contact: supplier.contact,
    city: supplier.city,
    notes: supplier.notes ?? "",
    isActive: supplier.isActive,
  }
}

function getErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Не вдалося зберегти постачальника. Спробуйте ще раз."
  }

  const error = payload as {
    detail?: string
    title?: string
    errors?: Record<string, string[] | string>
  }
  const validationMessage = error.errors
    ? Object.values(error.errors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .join(" ")
    : undefined

  return (
    error.detail ??
    validationMessage ??
    error.title ??
    "Не вдалося зберегти постачальника. Спробуйте ще раз."
  )
}

export function SupplierForm({
  supplier,
  onCancel,
  onSaved,
}: SupplierFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: getFormValues(supplier),
  })

  useEffect(() => {
    form.reset(getFormValues(supplier))
  }, [form, supplier])

  async function handleSubmit(values: SupplierFormValues) {
    setServerError(null)

    try {
      const response = await fetch(
        supplier
          ? `/api/admin/suppliers/${encodeURIComponent(supplier.id)}`
          : "/api/admin/suppliers",
        {
          method: supplier ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toSupplierInput(values)),
        }
      )
      const payload: unknown = await response.json().catch(() => null)

      if (!response.ok || !payload || typeof payload !== "object") {
        throw new Error(getErrorMessage(payload))
      }

      onSaved(payload as Supplier)
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Не вдалося зберегти постачальника. Спробуйте ще раз."
      )
    }
  }

  const fieldError = (field: keyof SupplierFormValues) =>
    form.formState.errors[field]?.message

  return (
    <form
      className="flex min-h-full flex-col"
      onSubmit={form.handleSubmit(handleSubmit)}
      noValidate
    >
      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        {serverError && (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {serverError}
          </p>
        )}

        <div className="space-y-2">
          <label htmlFor="supplier-name" className="text-sm font-medium">
            Назва <span aria-hidden="true">*</span>
          </label>
          <Input
            id="supplier-name"
            autoComplete="organization"
            placeholder="Наприклад, ТОВ «Затишок»"
            aria-invalid={Boolean(fieldError("name"))}
            {...form.register("name")}
          />
          {fieldError("name") && (
            <p className="text-sm text-destructive" role="alert">
              {fieldError("name")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="supplier-contact" className="text-sm font-medium">
            Контакт <span aria-hidden="true">*</span>
          </label>
          <Input
            id="supplier-contact"
            autoComplete="tel"
            placeholder="Телефон, Telegram або контактна особа"
            aria-invalid={Boolean(fieldError("contact"))}
            {...form.register("contact")}
          />
          {fieldError("contact") && (
            <p className="text-sm text-destructive" role="alert">
              {fieldError("contact")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="supplier-city" className="text-sm font-medium">
            Місто відправлення <span aria-hidden="true">*</span>
          </label>
          <Input
            id="supplier-city"
            autoComplete="address-level2"
            placeholder="Київ"
            aria-invalid={Boolean(fieldError("city"))}
            {...form.register("city")}
          />
          {fieldError("city") && (
            <p className="text-sm text-destructive" role="alert">
              {fieldError("city")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="supplier-notes" className="text-sm font-medium">
            Внутрішні нотатки
          </label>
          <textarea
            id="supplier-notes"
            rows={5}
            placeholder="Умови повернення, графік відправлень та інші деталі"
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-28 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3"
            aria-invalid={Boolean(fieldError("notes"))}
            {...form.register("notes")}
          />
          {fieldError("notes") && (
            <p className="text-sm text-destructive" role="alert">
              {fieldError("notes")}
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-3">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            {...form.register("isActive")}
          />
          <span>
            <span className="block text-sm font-medium">Активний</span>
            <span className="block text-xs text-muted-foreground">
              Постачальник доступний для нових операцій
            </span>
          </span>
        </label>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-border p-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Скасувати
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? "Збереження..."
            : supplier
              ? "Зберегти зміни"
              : "Додати постачальника"}
        </Button>
      </div>
    </form>
  )
}
