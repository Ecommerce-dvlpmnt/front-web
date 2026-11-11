import { ApiError, apiFetch } from "@/lib/api/client"
import type { Supplier, SupplierInput } from "@/types/supplier"

export interface GetSuppliersOptions {
  onlyActive?: boolean
}

const supplierFetchOptions = {
  next: {
    revalidate: 300,
    tags: ["suppliers"],
  },
}

function isSupplier(value: unknown): value is Supplier {
  if (!value || typeof value !== "object") return false

  const supplier = value as Partial<Supplier>

  return (
    typeof supplier.id === "string" &&
    typeof supplier.name === "string" &&
    typeof supplier.contact === "string" &&
    typeof supplier.city === "string" &&
    (supplier.notes === undefined || typeof supplier.notes === "string") &&
    typeof supplier.isActive === "boolean"
  )
}

function parseSupplier(value: unknown): Supplier {
  if (!isSupplier(value)) {
    throw new Error("Backend returned an invalid supplier response")
  }

  return value
}

export async function getSuppliers(
  { onlyActive = false }: GetSuppliersOptions = {}
): Promise<Supplier[]> {
  const query = new URLSearchParams({ onlyActive: String(onlyActive) })
  const payload = await apiFetch<unknown>(
    `suppliers?${query.toString()}`,
    supplierFetchOptions
  )

  if (!Array.isArray(payload) || !payload.every(isSupplier)) {
    throw new Error("Backend returned an invalid suppliers response")
  }

  return payload
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  try {
    return parseSupplier(
      await apiFetch<unknown>(
        `suppliers/${encodeURIComponent(id)}`,
        supplierFetchOptions
      )
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function createSupplier(
  input: SupplierInput
): Promise<Supplier> {
  return parseSupplier(
    await apiFetch<unknown>("suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  )
}

export async function updateSupplier(
  id: string,
  input: SupplierInput
): Promise<Supplier> {
  return parseSupplier(
    await apiFetch<unknown>(`suppliers/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  )
}

export async function deleteSupplier(id: string): Promise<void> {
  await apiFetch<unknown>(`suppliers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}
