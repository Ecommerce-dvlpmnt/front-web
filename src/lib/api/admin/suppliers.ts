import { ApiError, apiFetch } from "@/lib/api/client"
import { adminApiFetch } from "@/lib/api/admin/auth"
import type { Supplier, SupplierInput } from "@/types/supplier"

export interface GetSuppliersOptions {
  onlyActive?: boolean
}

const supplierFetchOptions = {
  next: {
    revalidate: 60,
    tags: ["suppliers"],
  },
}

function isSupplier(value: unknown): value is Supplier {
  if (!value || typeof value !== "object") return false

  const supplier = value as Record<string, unknown>

  return (
    typeof supplier.id === "string" &&
    typeof supplier.name === "string" &&
    (supplier.contact == null || typeof supplier.contact === "string") &&
    (supplier.city == null || typeof supplier.city === "string") &&
    (supplier.notes == null || typeof supplier.notes === "string") &&
    (typeof supplier.isActive === "boolean" || supplier.isActive == null)
  )
}

function parseSupplier(value: unknown): Supplier {
  if (!isSupplier(value)) {
    throw new Error("Backend returned an invalid supplier response")
  }

  const raw = value as unknown as Record<string, unknown>

  return {
    id: String(raw.id),
    name: String(raw.name ?? "Без назви"),
    contact: raw.contact ? String(raw.contact) : "",
    city: raw.city ? String(raw.city) : "",
    notes: raw.notes ? String(raw.notes) : "",
    isActive: raw.isActive !== false,
  }
}

export async function getSuppliers(
  { onlyActive = false }: GetSuppliersOptions = {}
): Promise<Supplier[]> {
  const query = new URLSearchParams({ onlyActive: String(onlyActive) })
  let payload: unknown

  try {
    payload = await adminApiFetch<unknown>(
      `admin/suppliers?${query.toString()}`,
      supplierFetchOptions
    )
  } catch (error) {
    // Fallback: якщо adminApiFetch без токена чи на прямому бекенді без префікса
    try {
      payload = await apiFetch<unknown>(
        `admin/suppliers?${query.toString()}`,
        supplierFetchOptions
      )
    } catch {
      try {
        payload = await apiFetch<unknown>(
          `suppliers?${query.toString()}`,
          supplierFetchOptions
        )
      } catch {
        throw error
      }
    }
  }

  if (!Array.isArray(payload)) {
    // Якщо бекенд повернув об'єкт з items
    const raw = payload as Record<string, unknown>
    const items = raw?.items ?? raw?.Items
    if (Array.isArray(items)) {
      return items.filter(isSupplier).map(parseSupplier)
    }
    throw new Error("Backend returned an invalid suppliers response")
  }

  return payload.filter(isSupplier).map(parseSupplier)
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  try {
    let payload: unknown
    try {
      payload = await adminApiFetch<unknown>(
        `admin/suppliers/${encodeURIComponent(id)}`,
        supplierFetchOptions
      )
    } catch {
      try {
        payload = await apiFetch<unknown>(
          `admin/suppliers/${encodeURIComponent(id)}`,
          supplierFetchOptions
        )
      } catch {
        payload = await apiFetch<unknown>(
          `suppliers/${encodeURIComponent(id)}`,
          supplierFetchOptions
        )
      }
    }

    return parseSupplier(payload)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function createSupplier(
  input: SupplierInput
): Promise<Supplier> {
  let payload: unknown
  try {
    payload = await adminApiFetch<unknown>("admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  } catch {
    payload = await apiFetch<unknown>("admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  }

  return parseSupplier(payload)
}
